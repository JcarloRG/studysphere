// src/pages/MisMatchesPage.jsx
import React, { useEffect, useState } from "react";
import { apiService } from "../services/api";

export default function MisMatchesPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    async function fetchMatches() {
      try {
        setLoading(true);
        const res = await apiService.obtenerMisMatches();
        setMatches(res.matches || []);
        setMensaje(res.message || "");
      } catch (err) {
        console.error("❌ Error cargando mis matches:", err);
        setMensaje(err.message || "Error al obtener tus matches.");
      } finally {
        setLoading(false);
      }
    }
    fetchMatches();
  }, []);

  if (loading) return <p>Cargando tus matches...</p>;

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Mis colaboraciones</h1>
      {mensaje && (
        <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>{mensaje}</p>
      )}

      {(!matches || matches.length === 0) && (
        <p>Aún no tienes matches aceptados. Empieza a conectar con otros perfiles.</p>
      )}

      <div style={{ marginTop: "1rem", display: "grid", gap: "1rem" }}>
        {matches.map((m) => (
          <div
            key={m.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "0.75rem",
              padding: "1rem",
              backgroundColor: "#f9fafb",
            }}
          >
            <p style={{ fontSize: "0.8rem", color: "#6b7280" }}>
              Match ID: {m.id} – Estado: <strong>{m.estado}</strong>
            </p>
            <p style={{ fontSize: "0.9rem" }}>
              Tú: {m.origen_tipo} #{m.origen_id} ↔ Otro: {m.destino_tipo} #
              {m.destino_id}
            </p>
            {/* Aquí después puedes hacer que se vea el nombre/foto del otro
                perfil haciendo llamadas adicionales a apiService.getPerfil() */}
          </div>
        ))}
      </div>
    </div>
  );
}
