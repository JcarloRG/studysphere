-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 20-10-2025 a las 08:57:18
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12
-- esta devuelta la base

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `studysphere`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `docentes`
--

CREATE TABLE `docentes` (
  `id` int(11) NOT NULL,
  `nombre_completo` varchar(150) NOT NULL,
  `correo_institucional` varchar(120) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `carrera_egreso` varchar(150) NOT NULL,
  `carreras_imparte` varchar(255) DEFAULT NULL,
  `grado_academico` varchar(100) DEFAULT NULL,
  `habilidades` text DEFAULT NULL,
  `logros` text DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `email_verify_token` varchar(64) DEFAULT NULL,
  `email_verify_expires` datetime DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `egresados`
--

CREATE TABLE `egresados` (
  `id` int(11) NOT NULL,
  `nombre_completo` varchar(150) NOT NULL,
  `correo_institucional` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `carrera_egreso` varchar(150) NOT NULL,
  `anio_egreso` year(4) NOT NULL,
  `ocupacion_actual` varchar(150) DEFAULT NULL,
  `perfil_linkedin` varchar(255) DEFAULT NULL,
  `empresa` varchar(150) DEFAULT NULL,
  `puesto` varchar(150) DEFAULT NULL,
  `logros` text DEFAULT NULL,
  `habilidades` text DEFAULT NULL,
  `competencias` text DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `email_verify_token` varchar(64) DEFAULT NULL,
  `email_verify_expires` datetime DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL,
  `foto` varchar(250) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `email_verifications`
--

CREATE TABLE `email_verifications` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `code` varchar(6) NOT NULL,
  `tipo` enum('estudiante','docente','egresado') DEFAULT 'estudiante',
  `perfil_id` int(11) DEFAULT NULL,
  `purpose` varchar(50) DEFAULT 'signup',
  `is_used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  `expires_at` datetime NOT NULL,
  `verified` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estudiantes`
--

CREATE TABLE `estudiantes` (
  `id` int(11) NOT NULL,
  `nombre_completo` varchar(150) NOT NULL,
  `correo_institucional` varchar(120) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `numero_control` varchar(50) NOT NULL,
  `carrera_actual` varchar(150) NOT NULL,
  `otra_carrera` varchar(150) DEFAULT 'No',
  `semestre` varchar(20) DEFAULT NULL,
  `habilidades` text DEFAULT NULL,
  `area_interes` text DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `email_verify_token` varchar(64) DEFAULT NULL,
  `email_verify_expires` datetime DEFAULT NULL,
  `verified_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `matches`
--

CREATE TABLE `matches` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `usuario_tipo` enum('estudiante','docente','egresado') NOT NULL,
  `perfil_match_id` int(11) NOT NULL,
  `perfil_match_tipo` enum('estudiante','docente','egresado') NOT NULL,
  `compatibilidad` int(11) NOT NULL,
  `estado` enum('pendiente','aceptado','rechazado') DEFAULT 'pendiente',
  `fecha_match` timestamp NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_preferences`
--

CREATE TABLE `user_preferences` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `usuario_tipo` enum('estudiante','docente','egresado') NOT NULL,
  `habilidades_buscadas` text DEFAULT NULL,
  `intereses_buscados` text DEFAULT NULL,
  `tipo_colaboracion` enum('proyecto','investigacion','startup','estudio') DEFAULT 'proyecto',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `docentes`
--
ALTER TABLE `docentes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_doce_correo` (`correo_institucional`);

--
-- Indices de la tabla `egresados`
--
ALTER TABLE `egresados`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_egre_correo` (`correo_institucional`);

--
-- Indices de la tabla `email_verifications`
--
ALTER TABLE `email_verifications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_email_purpose` (`email`,`purpose`);

--
-- Indices de la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_estu_correo` (`correo_institucional`);

--
-- Indices de la tabla `matches`
--
ALTER TABLE `matches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_match_usuario` (`usuario_id`,`usuario_tipo`,`perfil_match_id`,`perfil_match_tipo`),
  ADD KEY `idx_usuario` (`usuario_id`,`usuario_tipo`),
  ADD KEY `idx_match` (`perfil_match_id`,`perfil_match_tipo`);

--
-- Indices de la tabla `user_preferences`
--
ALTER TABLE `user_preferences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_usuario_preferences` (`usuario_id`,`usuario_tipo`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `docentes`
--
ALTER TABLE `docentes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `egresados`
--
ALTER TABLE `egresados`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `email_verifications`
--
ALTER TABLE `email_verifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `matches`
--
ALTER TABLE `matches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `user_preferences`
--
ALTER TABLE `user_preferences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;