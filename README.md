# Tourist Cocoon - Sistema de Gestión de Cápsulas 🏨🛌

¡Bienvenido al repositorio oficial del proyecto **Tourist Cocoon** (Grupo 14 - ISST)! 

Este proyecto implementa una plataforma web premium para la gestión, reserva y acceso a un hostal automatizado basado en cápsulas. A continuación, te explicamos cómo está estructurado el código, qué tecnologías utilizamos y cómo está pensada la arquitectura para escalar.

---

## 🏗️ 1. Arquitectura General del Sistema

El proyecto sigue una arquitectura clásica **Cliente-Servidor**, dividida en dos grandes bloques completamente independientes que se comunican a través de una API REST.1.

### Backend (Carpeta `/backend`)
Construido en **Java 21** con el framework **Spring Boot 3**. Sigue una arquitectura limpia y tradicional de 4 capas:
1. **Domain (Modelo de Datos):** Aquí viven nuestras entidades en español (`Reserva`, `Huesped`, `Capsula`, `RegistroAcceso`). Representan las tablas de nuestra base de datos.
2. **Repository (Capa de Acceso a Datos):** Interfaces que heredan de `JpaRepository`. Se encargan de guardar, buscar y borrar entidades en la base de datos sin que tengamos que escribir SQL manualmente.
3. **Service (Capa de Negocio):** Aquí reside el "cerebro" (ej. `ReservationService`, `CheckInService`). Contiene la lógica compleja, validaciones (máximo 7 días por reserva), y asegura que las reglas de negocio se cumplan.
4. **Controller (Capa de API):** Exponen los endpoints REST (`/api/v1/reservations`, etc.). Reciben las peticiones del frontend en formato JSON, llaman a los Servicios correspondientes, y devuelven una respuesta HTTP (200 OK, 400 Bad Request...).

### Frontend (Carpeta `/frontend`)
Construido con **TypeScript**, **React** y el framework **Next.js 14**.
1. **Estructura App Router:** Utiliza el nuevo enrutador de Next.js (`/src/app`). Cada carpeta representa una página (ej. `/checkin/page.tsx`, `/reservations/new/page.tsx`).
2. **Next.js Proxy:** Utilizamos `next.config.js` para redirigir internamente las llamadas `/api/*` hacia nuestro servidor Java. Esto nos evita problemas de seguridad (CORS) directamente en el navegador.
3. **Componentes "Client-Side":** Usamos `"use client"` en la parte superior de las páginas que necesitan interactividad (estados, botones, formularios y peticiones de red).

---

## 🛠️ 2. Stack Tecnológico

**Backend:**
*   **Java 21:** Última versión LTS (Long Term Support).
*   **Spring Boot:** Framework principal para arrancar el servidor web y la inyección de dependencias.
*   **Lombok:** Librería para ahorrarnos escribir *getters*, *setters* y constructores mediante etiquetas (`@Getter`, `@Builder`).
*   **Spring Data JPA / Hibernate:** El ORM que traduce nuestras clases Java (`@Entity`) en tablas de la base de datos.
*   **Swagger (OpenAPI):** Documentación interactiva autogenerada de nuestra API.

**Frontend:**
*   **Next.js (React):** Para la creación de la interfaz de usuario moderna.
*   **Tailwind CSS:** Framework de estilos. Nos permite diseñar interfaces premium ("Glassmorphism", gradientes, flexbox) directamente escribiendo clases como `bg-blue-500` o `rounded-xl` en el HTML.
*   **Lucide React:** Para los iconos SVG modernos y minimalistas (flechas, candados, etc.).
*   **Axios / Fetch:** Para enviar y recibir datos en formato JSON desde el Backend.

---

## 💾 3. Base de Datos H2 (En Memoria)

Para este Sprint, hemos integrado **H2**, una base de datos relacional ligera que funciona **completamente en la memoria RAM** (In-Memory Database).

**¿Por qué usamos H2 ahora mismo?**
* **Fricción Cero:** No requiere instalar programas externos (como MySQL Server). Al ejecutar Java, la base de datos nace de cero.
* **Agilidad:** Si cambiamos el modelo de datos (añadimos columnas), no hay que lidiar con problemas de migración; al reiniciar, las tablas se recrean limpias mediante la opción `hibernate.ddl-auto: create-drop`.
* **Consola Integrada:** Spring Boot nos ofrece un panel de control en `/h2-console` para ver nuestras tablas y hacer consultas SQL como si fuera una base de datos real.

**El Futuro:** En el archivo `application.yml` le hemos puesto el parámetro `MODE=PostgreSQL`. Cuando el proyecto salga a "Producción" (Internet), solo tendremos que cambiar la URL del `application.yml` para conectarnos a una base de datos PostgreSQL real y persistente, sin tener que cambiar ni una sola línea de código Java.

---

## 🚀 4. Guía de Ejecución Local

Para probar la plataforma al completo, necesitas abrir **dos terminales diferentes** en la raíz del proyecto.

### 4.1 Arrancar el Backend (Java)
Para arrancarlo, vamos a backend/src/java/TouristCocoonApplication.java y hacemos "run"

### 4.2 Arrancar el Frontend (Next.js)
Ahora nos situamos en frontend, y ejecutamos npm run dev


