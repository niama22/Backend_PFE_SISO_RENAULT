package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/google/uuid"
	"github.com/segmentio/kafka-go"
)

type config struct {
	Port int

	KafkaBrokers                 []string
	TopicMissionAssigned        string
	TopicGPSLocationUpdate      string
	KafkaConsumerGroupMissionID string

	TimescaleHost     string
	TimescalePort     int
	TimescaleDB       string
	TimescaleUser     string
	TimescalePassword string
}

type gpsLocationUpdateRequest struct {
	MissionID string  `json:"missionId"`
	OrderID   string  `json:"orderId,omitempty"`
	TruckID   string  `json:"truckId,omitempty"`

	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	SpeedKmh  float64 `json:"speedKmh"`
	Timestamp *string `json:"timestamp,omitempty"`

	// Optional destination for ETA computation. If omitted, we try to load
	// destination from the `missions` table populated by the `mission.assigned` event.
	Destination *struct {
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
	} `json:"destination,omitempty"`
}

type missionAssignedEvent struct {
	MissionID           string   `json:"missionId"`
	OrderID             string   `json:"orderId,omitempty"`
	DestinationLatitude float64  `json:"destinationLatitude"`
	DestinationLongitude float64 `json:"destinationLongitude"`
	DestinationCity     string   `json:"destinationCity,omitempty"`
	AssignedAt          *string  `json:"assignedAt,omitempty"`
}

type gpsLocationPoint struct {
	ID         uuid.UUID
	MissionID string
	OrderID   sql.NullString
	TruckID   sql.NullString
	Latitude  float64
	Longitude float64
	SpeedKmh  float64
	Ts         time.Time
	EtaSeconds sql.NullInt64
}

func main() {
	cfg := mustLoadConfig()

	db, err := connectTimescale(cfg)
	if err != nil {
		log.Fatalf("timescaledb connection failed: %v", err)
	}
	defer db.Close()

	if err := ensureSchema(db); err != nil {
		log.Fatalf("schema ensure failed: %v", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Kafka producer for GPS updates
	gpsWriter := &kafka.Writer{
		Addr:         kafka.TCP(cfg.KafkaBrokers...),
		Topic:        cfg.TopicGPSLocationUpdate,
		RequiredAcks: kafka.RequireOne,
		Balancer:     &kafka.LeastBytes{},
	}
	defer gpsWriter.Close()

	// Kafka consumer for mission assignment
	missionReader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:   cfg.KafkaBrokers,
		Topic:     cfg.TopicMissionAssigned,
		GroupID:   cfg.KafkaConsumerGroupMissionID,
		MinBytes:  1e3,
		MaxBytes:  10e6,
		QueueCapacity: 100,
	})
	defer missionReader.Close()

	errCh := make(chan error, 1)
	go func() {
		if err := consumeMissionAssigned(ctx, db, gpsWriter, missionReader); err != nil && !errors.Is(err, context.Canceled) {
			errCh <- err
		}
	}()

	mux := http.NewServeMux()
	// Kong is configured with `strip_path: false` for /gps -> service.
	// To be resilient, we support both:
	// - /gps/...
	// - /api/gps/...
	mux.HandleFunc("/gps/health", func(w http.ResponseWriter, r *http.Request) { health(w) })
	mux.HandleFunc("/api/gps/health", func(w http.ResponseWriter, r *http.Request) { health(w) })

	mux.HandleFunc("/gps/location/update", func(w http.ResponseWriter, r *http.Request) {
		updateLocation(w, r, cfg, db, gpsWriter)
	})
	mux.HandleFunc("/api/gps/location/update", func(w http.ResponseWriter, r *http.Request) {
		updateLocation(w, r, cfg, db, gpsWriter)
	})

	mux.HandleFunc("/gps/latest", func(w http.ResponseWriter, r *http.Request) {
		latest(w, r, cfg, db)
	})
	mux.HandleFunc("/api/gps/latest", func(w http.ResponseWriter, r *http.Request) {
		latest(w, r, cfg, db)
	})

	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Port),
		Handler: mux,
	}

	// Graceful shutdown
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		select {
		case sig := <-sigCh:
			log.Printf("gps-service shutting down (signal: %v)", sig)
			cancel()
		case err := <-errCh:
			log.Printf("gps-service consumer error: %v", err)
			cancel()
		}
	}()

	log.Printf("gps-service listening on :%d", cfg.Port)
	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("http server failed: %v", err)
	}

	_ = server.Shutdown(context.Background())
}

func mustLoadConfig() config {
	port := getenvInt("GPS_PORT", 3004)

	brokerRaw := strings.TrimSpace(os.Getenv("KAFKA_BROKER"))
	if brokerRaw == "" {
		brokerRaw = "kafka:9092"
	}
	brokers := splitAndTrim(brokerRaw, ",")

	return config{
		Port: port,

		KafkaBrokers:                 brokers,
		TopicMissionAssigned:        getenvString("KAFKA_TOPIC_MISSION_ASSIGNED", "mission.assigned"),
		TopicGPSLocationUpdate:      getenvString("KAFKA_TOPIC_GPS_LOCATION_UPDATE", "gps.location.update"),
		KafkaConsumerGroupMissionID: getenvString("KAFKA_CONSUMER_GROUP", "gps-service"),

		TimescaleHost:     getenvString("TIMESCALE_HOST", "timescaledb"),
		TimescalePort:     getenvInt("TIMESCALE_PORT", 5432),
		TimescaleDB:       getenvString("TIMESCALE_DB", "siso_gps"),
		TimescaleUser:     getenvString("TIMESCALE_USER", "siso_user"),
		TimescalePassword: getenvString("TIMESCALE_PASSWORD", "siso_pass_2025"),
	}
}

func getenvString(k, def string) string {
	if v := strings.TrimSpace(os.Getenv(k)); v != "" {
		return v
	}
	return def
}

func getenvInt(k string, def int) int {
	v := strings.TrimSpace(os.Getenv(k))
	if v == "" {
		return def
	}
	i, err := strconv.Atoi(v)
	if err != nil {
		return def
	}
	return i
}

func splitAndTrim(s, sep string) []string {
	parts := strings.Split(s, sep)
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

func connectTimescale(cfg config) (*sql.DB, error) {
	// Use lib/pq. TimescaleDB is a Postgres-compatible endpoint.
	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		cfg.TimescaleHost, cfg.TimescalePort, cfg.TimescaleUser, cfg.TimescalePassword, cfg.TimescaleDB,
	)
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		return nil, err
	}
	return db, nil
}

func ensureSchema(db *sql.DB) error {
	// Keep it simple: plain Postgres tables (TimescaleDB will still store them).
	// If later you want hypertables, we can convert them with `create_hypertable`.
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS missions (
			mission_id TEXT PRIMARY KEY,
			order_id TEXT,
			destination_lat DOUBLE PRECISION,
			destination_lon DOUBLE PRECISION,
			destination_city TEXT,
			updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE TABLE IF NOT EXISTS gps_locations (
			id UUID PRIMARY KEY,
			mission_id TEXT NOT NULL,
			order_id TEXT,
			truck_id TEXT,
			latitude DOUBLE PRECISION NOT NULL,
			longitude DOUBLE PRECISION NOT NULL,
			speed_kmh DOUBLE PRECISION NOT NULL,
			ts TIMESTAMPTZ NOT NULL,
			eta_seconds BIGINT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
		);`,
		`CREATE INDEX IF NOT EXISTS idx_gps_locations_mission_ts
			ON gps_locations(mission_id, ts DESC);`,
	}
	for _, s := range stmts {
		if _, err := db.Exec(s); err != nil {
			return err
		}
	}
	return nil
}

func health(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{"status": "ok"})
}

func updateLocation(
	w http.ResponseWriter,
	r *http.Request,
	cfg config,
	db *sql.DB,
	writer *kafka.Writer,
) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req gpsLocationUpdateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid json", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(req.MissionID) == "" {
		http.Error(w, "missionId is required", http.StatusBadRequest)
		return
	}
	if req.Latitude == 0 && req.Longitude == 0 {
		http.Error(w, "latitude/longitude are required", http.StatusBadRequest)
		return
	}
	if req.SpeedKmh < 0 {
		http.Error(w, "speedKmh must be >= 0", http.StatusBadRequest)
		return
	}

	ts := time.Now().UTC()
	if req.Timestamp != nil && strings.TrimSpace(*req.Timestamp) != "" {
		parsed, err := time.Parse(time.RFC3339, strings.TrimSpace(*req.Timestamp))
		if err == nil {
			ts = parsed.UTC()
		}
	}

	var destLat, destLon float64
	destKnown := false
	if req.Destination != nil {
		destLat, destLon = req.Destination.Latitude, req.Destination.Longitude
		// If destination wasn't actually provided (common in JSON payloads),
		// coordinates can default to (0,0). Treat that as "unknown".
		destKnown = !(destLat == 0 && destLon == 0)
	} else {
		destLat, destLon, destKnown = getMissionDestination(db, req.MissionID)
	}

	var etaSeconds *int64
	if destKnown && req.SpeedKmh > 0 {
		distanceKm := haversineKm(req.Latitude, req.Longitude, destLat, destLon)
		etaSec := int64(math.Round((distanceKm / req.SpeedKmh) * 3600))
		if etaSec >= 0 {
			etaSeconds = &etaSec
		}
	}

	id := uuid.New()
	_, err := db.ExecContext(
		r.Context(),
		`INSERT INTO gps_locations (id, mission_id, order_id, truck_id, latitude, longitude, speed_kmh, ts, eta_seconds)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
		id, req.MissionID, nullOrString(req.OrderID), nullOrString(req.TruckID),
		req.Latitude, req.Longitude, req.SpeedKmh, ts, etaSeconds,
	)
	if err != nil {
		http.Error(w, "db insert failed", http.StatusInternalServerError)
		return
	}

	eventPayload := map[string]any{
		"missionId":   req.MissionID,
		"orderId":     req.OrderID,
		"truckId":     req.TruckID,
		"latitude":    req.Latitude,
		"longitude":   req.Longitude,
		"speedKmh":    req.SpeedKmh,
		"timestamp":   ts.Format(time.RFC3339),
		"etaSeconds":  etaSeconds, // null if unknown
		"computedAt":  time.Now().UTC().Format(time.RFC3339),
	}
	payloadBytes, _ := json.Marshal(eventPayload)
	// Use message key for partitioning by missionId.
	msg := kafka.Message{
		Key:   []byte(req.MissionID),
		Value: payloadBytes,
	}
	if err := writer.WriteMessages(r.Context(), msg); err != nil {
		http.Error(w, "kafka publish failed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	_ = json.NewEncoder(w).Encode(map[string]any{
		"id":          id.String(),
		"etaSeconds": etaSeconds,
	})
}

func latest(w http.ResponseWriter, r *http.Request, cfg config, db *sql.DB) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	missionID := strings.TrimSpace(r.URL.Query().Get("missionId"))
	if missionID == "" {
		http.Error(w, "missionId is required", http.StatusBadRequest)
		return
	}

	point, err := getLatestGpsPoint(db, missionID)
	if err != nil {
		http.Error(w, "db query failed", http.StatusInternalServerError)
		return
	}
	if point == nil {
		http.Error(w, "no gps data for missionId", http.StatusNotFound)
		return
	}

	// Ensure ETA is present by recomputing from stored destination, if possible.
	destLat, destLon, destKnown := getMissionDestination(db, missionID)
	var etaSeconds *int64
	if destKnown && point.SpeedKmh > 0 {
		distanceKm := haversineKm(point.Latitude, point.Longitude, destLat, destLon)
		etaSec := int64(math.Round((distanceKm / point.SpeedKmh) * 3600))
		if etaSec >= 0 {
			etaSeconds = &etaSec
		}
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]any{
		"missionId":     point.MissionID,
		"orderId":       point.OrderID.String,
		"truckId":       point.TruckID.String,
		"latitude":      point.Latitude,
		"longitude":     point.Longitude,
		"speedKmh":      point.SpeedKmh,
		"timestamp":     point.Ts.Format(time.RFC3339),
		"etaSeconds":    etaSeconds, // computed from stored destination
		"storedEta":     point.EtaSeconds, // whatever we stored at ingestion time
	})
}

func consumeMissionAssigned(
	ctx context.Context,
	db *sql.DB,
	writer *kafka.Writer,
	reader *kafka.Reader,
) error {
	for {
		m, err := reader.FetchMessage(ctx)
		if err != nil {
			// Reader.FetchMessage returns an error on shutdown/cancel.
			return err
		}

		var evt missionAssignedEvent
		if err := json.Unmarshal(m.Value, &evt); err != nil {
			log.Printf("mission.assigned invalid payload: %v", err)
			continue
		}

		if strings.TrimSpace(evt.MissionID) == "" {
			log.Printf("mission.assigned missing missionId")
			continue
		}

		if err := upsertMissionDestination(db, evt); err != nil {
			log.Printf("failed to upsert mission destination: %v", err)
			continue
		}

		// Optional: we can re-publish an acknowledgement event, but not required.
		// Still log for now.
		log.Printf("mission destination updated: missionId=%s", evt.MissionID)
	}
}

func upsertMissionDestination(db *sql.DB, evt missionAssignedEvent) error {
	_, err := db.ExecContext(
		context.Background(),
		`INSERT INTO missions (mission_id, order_id, destination_lat, destination_lon, destination_city, updated_at)
		 VALUES ($1,$2,$3,$4,$5,NOW())
		 ON CONFLICT (mission_id) DO UPDATE SET
			order_id = EXCLUDED.order_id,
			destination_lat = EXCLUDED.destination_lat,
			destination_lon = EXCLUDED.destination_lon,
			destination_city = EXCLUDED.destination_city,
			updated_at = NOW()`,
		evt.MissionID,
		nullOrString(evt.OrderID),
		evt.DestinationLatitude,
		evt.DestinationLongitude,
		nullOrString(evt.DestinationCity),
	)
	return err
}

func getMissionDestination(db *sql.DB, missionID string) (float64, float64, bool) {
	var lat, lon float64
	err := db.QueryRow(
		`SELECT destination_lat, destination_lon FROM missions WHERE mission_id = $1`,
		missionID,
	).Scan(&lat, &lon)
	if err != nil {
		return 0, 0, false
	}
	// Treat unset destination as unknown.
	if lat == 0 && lon == 0 {
		return 0, 0, false
	}
	return lat, lon, true
}

func getLatestGpsPoint(db *sql.DB, missionID string) (*gpsLocationPoint, error) {
	var p gpsLocationPoint
	err := db.QueryRow(
		`SELECT id, mission_id, order_id, truck_id, latitude, longitude, speed_kmh, ts, eta_seconds
		 FROM gps_locations
		 WHERE mission_id = $1
		 ORDER BY ts DESC
		 LIMIT 1`,
		missionID,
	).Scan(
		&p.ID,
		&p.MissionID,
		&p.OrderID,
		&p.TruckID,
		&p.Latitude,
		&p.Longitude,
		&p.SpeedKmh,
		&p.Ts,
		&p.EtaSeconds,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &p, nil
}

func haversineKm(lat1, lon1, lat2, lon2 float64) float64 {
	const r = 6371.0 // Earth radius in kilometers
	phi1 := lat1 * math.Pi / 180
	phi2 := lat2 * math.Pi / 180
	dphi := (lat2 - lat1) * math.Pi / 180
	dlambda := (lon2 - lon1) * math.Pi / 180

	a := math.Sin(dphi/2)*math.Sin(dphi/2) +
		math.Cos(phi1)*math.Cos(phi2)*math.Sin(dlambda/2)*math.Sin(dlambda/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	return r * c
}

func nullOrString(s string) any {
	// lib/pq maps nil -> NULL
	if strings.TrimSpace(s) == "" {
		return nil
	}
	return s
}

