# Battleship – Aplicación distribuida con Django y Vue

Este proyecto es una aplicación web del juego *Battleship*, diseñada como un sistema distribuido con separación entre frontend y backend.

## 🧠 Objetivos del proyecto

- Desarrollar una API REST robusta con autenticación basada en JWT.
- Implementar un frontend SPA moderno con Vue.
- Gestionar partidas, jugadores y estado del juego mediante modelos relacionados y rutas anidadas.
- Generar documentación automática del backend con OpenAPI (drf-spectacular).

## ⚙️ Tecnologías utilizadas

### Backend (Python)
- Django · Django REST Framework
- JWT (djangorestframework-simplejwt)
- drf-spectacular · CORS headers · Ruteo anidado

### Frontend (JavaScript)
- Vue 3 · Pinia · Vue Router · Axios · Vite
- HTML5 · CSS3

## 🌐 Arquitectura

El proyecto sigue una arquitectura cliente-servidor clásica:

- El **backend** expone una API REST para gestionar usuarios, partidas y movimientos.
- El **frontend** consume dicha API y proporciona una interfaz dinámica y responsiva para jugar.

## 📄 Documentación de la API

La documentación OpenAPI se genera automáticamente y puede consultarse aquí:

https://softwaredistribuitub-2025.github.io/pr2-c08/

## 📁 Estructura del repositorio

- `backend/` → Código Python con Django
- `frontend/` → Aplicación Vue 3
- `README.md` → Documentación del proyecto

## 👨‍💻 Desarrolladores

Proyecto desarrollado en el marco de la asignatura de *Software Distribuido* del Grado en Ingeniería Informática (UB).
