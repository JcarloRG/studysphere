// src/pages/ProyectosListPage.jsx
import React, { useEffect, useState } from "react";
import { apiService } from "../services/api";

export default function ProyectosListPage() {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    async function fetchProyectos() {
      try {
        const res = await apiService.getProyectos();
        setProyectos(res.data || []);
      } catch (err) {
        console.error("❌ Error cargando proyectos:", err);
        setMensaje(err.message || "Error al cargar los proyectos.");
      } finally {
        setLoading(false);
      }
    }
    fetchProyectos();
  }, []);

  if (loading) return <p>Cargando proyectos...</p>;

  return (
    <div style={{ padding: "1.5rem" }}>
      <h1>Proyectos disponibles</h1>
      {mensaje && (
        <p style={{ color: "#b91c1c", fontSize: "0.9rem" }}>{mensaje}</p>
      )}

      {(!proyectos || proyectos.length === 0) && (
        <p>No hay proyectos registrados todavía.</p>
      )}

      <div style={{ marginTop: "1rem", display: "grid", gap: "1rem" }}>
        {proyectos.map((p) => (
          <div
            key={p.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "0.75rem",
              padding: "1rem",
            }}
          >
            <h2 style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>
              {p.nombre || p.titulo || `Proyecto #${p.id}`}
            </h2>
            <p style={{ fontSize: "0.9rem", color: "#4b5563" }}>
              {p.descripcion || "Sin descripción."}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
