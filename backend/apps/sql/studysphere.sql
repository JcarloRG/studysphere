-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 11-10-2025 a las 04:02:21
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
  `carrera_egreso` varchar(150) NOT NULL,
  `carreras_imparte` varchar(255) DEFAULT NULL,
  `grado_academico` varchar(100) DEFAULT NULL,
  `habilidades` text DEFAULT NULL,
  `logros` text DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `egresados`
--

CREATE TABLE `egresados` (
  `id` int(11) NOT NULL,
  `nombre_completo` varchar(150) NOT NULL,
  `correo_institucional` varchar(100) NOT NULL,
  `carrera_egreso` varchar(150) NOT NULL,
  `anio_egreso` year(4) NOT NULL,
  `ocupacion_actual` varchar(150) DEFAULT NULL,
  `perfil_linkedin` varchar(255) DEFAULT NULL,
  `empresa` varchar(150) DEFAULT NULL,
  `puesto` varchar(150) DEFAULT NULL,
  `logros` text DEFAULT NULL,
  `habilidades` text DEFAULT NULL,
  `competencias` text DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estudiantes`
--

CREATE TABLE `estudiantes` (
  `id` int(11) NOT NULL,
  `nombre_completo` varchar(150) NOT NULL,
  `correo_institucional` varchar(120) NOT NULL,
  `numero_control` varchar(50) NOT NULL,
  `carrera_actual` varchar(150) NOT NULL,
  `otra_carrera` varchar(150) DEFAULT 'No',
  `semestre` varchar(20) DEFAULT NULL,
  `habilidades` text DEFAULT NULL,
  `area_interes` text DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `docentes`
--
ALTER TABLE `docentes`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `egresados`
--
ALTER TABLE `egresados`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  ADD PRIMARY KEY (`id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;