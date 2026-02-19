// src/components/MatchButton.jsx
import React, { useEffect, useState } from "react";
import { apiService } from "../services/api";

export default function MatchButton({ perfilId, tipoPerfil }) {
  const [estado, setEstado] = useState("cargando"); // "no_match", "pendiente", "aceptado", "error"
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchEstado() {
      try {
        setLoading(true);
        const res = await apiService.verificarEstadoMatch(perfilId);
        if (!isMounted) return;
        setEstado(res.estado || "no_match");
        setMensaje(res.message || "");
      } catch (err) {
        console.error("❌ Error obteniendo estado de match:", err);
        if (!isMounted) return;
        setEstado("error");
        setMensaje(err.message || "Error al verificar el estado del match");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (perfilId && tipoPerfil) {
      fetchEstado();
    }

    return () => {
      isMounted = false;
    };
  }, [perfilId, tipoPerfil]);

  async function handleEnviarSolicitud() {
    try {
      setLoading(true);
      const res = await apiService.enviarSolicitudMatch(perfilId, tipoPerfil);
      setMensaje(res.message || "");
      // El backend puede devolver estado 'pendiente' o 'aceptado'
      if (res.success && res.data?.estado) {
        setEstado(res.data.estado);
      } else {
        setEstado("pendiente");
      }
    } catch (err) {
      console.error("❌ Error al enviar solicitud de match:", err);
      setMensaje(err.message || "Error al enviar la solicitud de match");
      setEstado("error");
    } finally {
      setLoading(false);
    }
  }

  let textoBoton = "";
  let disabled = false;

  if (loading) {
    textoBoton = "Procesando...";
    disabled = true;
  } else {
    switch (estado) {
      case "no_match":
        textoBoton = "Conectar";
        disabled = false;
        break;
      case "pendiente":
        textoBoton = "Solicitud enviada";
        disabled = true;
        break;
      case "aceptado":
        textoBoton = "Ya son match 🎉";
        disabled = true;
        break;
      case "error":
      default:
        textoBoton = "Reintentar";
        disabled = false;
        break;
    }
  }

  return (
    <div style={{ marginTop: "1rem" }}>
      <button
        onClick={estado === "no_match" || estado === "error" ? handleEnviarSolicitud : undefined}
        disabled={disabled}
        style={{
          padding: "0.5rem 1rem",
          borderRadius: "999px",
          border: "none",
          cursor: disabled ? "default" : "pointer",
          backgroundColor:
            estado === "aceptado"
              ? "#16a34a"
              : estado === "pendiente"
              ? "#f97316"
              : "#2563eb",
          color: "white",
          opacity: disabled && estado !== "aceptado" ? 0.8 : 1,
          fontWeight: 600,
          fontSize: "0.9rem",
        }}
      >
        {textoBoton}
      </button>
      {mensaje && (
        <p style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#6b7280" }}>
          {mensaje}
        </p>
      )}
    </div>
  );
}
