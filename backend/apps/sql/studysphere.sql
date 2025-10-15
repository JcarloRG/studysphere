-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 15-10-2025 a las 20:01:19
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

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
  `verified_at` datetime DEFAULT NULL
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

--
-- Volcado de datos para la tabla `estudiantes`
--

INSERT INTO `estudiantes` (`id`, `nombre_completo`, `correo_institucional`, `password_hash`, `numero_control`, `carrera_actual`, `otra_carrera`, `semestre`, `habilidades`, `area_interes`, `fecha_registro`, `email_verified`, `email_verify_token`, `email_verify_expires`, `verified_at`) VALUES
(1, 'Anuhar', 'anuhar@itsx.edu', '', '192108941', 'Sistemas Computacionales', 'No', '', '', '', '2025-10-13 18:44:08', 0, NULL, NULL, NULL),
(2, 'Anuhar', 'pinanuhar@gmail.com', '', '12345123', 'Sistemas', 'No', '7', 'asda', 'asda', '2025-10-14 17:05:10', 0, NULL, NULL, NULL),
(4, 'Anuhar', 'pinanuhar30@gmail.com', 'pbkdf2_sha256$600000$QIjIyeO9EbwWwUcvJvIR0s$6WiEi+qX60ieli2Hhs3I0hcaHEIodVSTcEP8GZ5VbJg=', '12311231123', 'Sistemas', 'No', '7', '', '', '2025-10-15 17:50:54', 0, NULL, NULL, NULL);

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
-- Indices de la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_estu_correo` (`correo_institucional`);

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
-- AUTO_INCREMENT de la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
