# Tourist Cocoon - Sistema de Gestión de Cápsulas 🏨🛌

¡Bienvenido al repositorio oficial del proyecto **Tourist Cocoon**!

Este proyecto implementa un MVP (Minimum Viable Product) de una plataforma B2B premium para la gestión desatendida, reserva y control de accesos en un hostal automatizado basado en cápsulas. A continuación, te explicamos cómo está estructurado el código, qué tecnologías utilizamos y cómo está pensada la arquitectura para escalar.

---

## 🏗️ 1. Arquitectura General del Sistema

El proyecto sigue una arquitectura clásica **Cliente-Servidor**, dividida en dos grandes bloques completamente independientes que se comunican a través de una API REST.

### Backend (Carpeta `/backend`)
Construido en **Java 21** con el framework **Spring Boot 3**. Sigue una arquitectura de 4 capas:
1. **Domain (Modelo de Datos):** Aquí viven nuestras entidades (`Reserva`, `Huesped`, `Capsula`, `RegistroAcceso`, `Incidencia`). Representan las tablas de nuestra base de datos.
2. **Repository (Capa de Acceso a Datos):** Interfaces que heredan de `JpaRepository`. Se encargan de guardar, buscar y borrar entidades en la base de datos, combinando los métodos derivados de Spring Data con consultas JPQL propias (`@Query`): conteos para las métricas del panel y `JOIN FETCH` para evitar el problema N+1.
3. **Service (Capa de Negocio):** Aquí reside el "cerebro" (ej. `ReservationService`, `CheckInService`). Contiene la lógica compleja y asegura que las reglas de negocio se cumplan.
4. **Controller (Capa de API):** Exponen los endpoints REST (`/api/v1/reservations`, etc.). Reciben las peticiones del frontend en formato JSON, llaman a los Servicios correspondientes y devuelven una respuesta HTTP.

### Frontend (Carpeta `/frontend`)
Construido con **TypeScript**, **React** y el framework **Next.js 14**.
1. **Estructura App Router:** Utiliza el nuevo enrutador de Next.js (`/src/app`). Cada carpeta representa una página (ej. `/checkin/page.tsx`, `/reservations/new/page.tsx`).
2. **Next.js Proxy:** Utilizamos `next.config.js` para reescribir las llamadas `/api/*` hacia `http://localhost:8080`. El navegador solo habla con el origen del frontend, así que no hace falta configurar CORS en el backend.
3. **Componentes "Client-Side":** Usamos `"use client"` en la parte superior de las páginas que necesitan interactividad (estados, botones, formularios y peticiones de red).

La especificación OpenAPI inicial de la API está en `openapi/tourist-cocoon-api.yaml`, y la documentación completa y actualizada se genera automáticamente con Swagger UI (springdoc).

---

## ⚙️ 2. Core Business Logic & Seguridad (Destacado)

El sistema no es un simple CRUD; implementa reglas de negocio reales y una capa de seguridad para la gestión de la plataforma:

*   **Motor de Restricciones de Estancia:** El backend bloquea las reservas que superen 7 noches consecutivas o 15 días naturales en un mismo mes por huésped, para garantizar el uso turístico (no residencial) de las cápsulas.
*   **Autenticación y Autorización (JWT & RBAC):** Implementación de `JwtAuthenticationFilter` y `SecurityConfig` para proteger endpoints según el rol (ADMIN para gestión de cápsulas, USER para operaciones estándar). Uso de tokens JWT (*stateless*) y hashing de contraseñas con BCrypt. Intercepción de peticiones erróneas mediante un `GlobalExceptionHandler`.
*   **Flujo de Check-in Desatendido:** Lógica de negocio que vincula la validación de identidad (DNI/Pasaporte) con la generación de un PIN secreto de 6 dígitos con SecureRandom para la apertura de la cápsula.
*   **Reservas:** Asignación automática de cápsula: `ReservationService` asigna la primera cápsula libre para las fechas solicitadas, comprobando el solapamiento con las reservas existentes (las canceladas no cuentan).
*   **Control de Acceso:** `AccessService` autoriza la apertura de la cápsula validando DNI y PIN contra una reserva con check-in realizado, y guarda cada apertura en `RegistroAcceso` como registro de auditoría.
*   **Check-out:** `CheckOutService` cierra la reserva (`COMPLETADA`), invalida el PIN y deja la cápsula en `PENDIENTE_LIMPIEZA`.
*   **Incidencias:** El huésped las reporta por categoría sobre una reserva con check-in realizado y consulta las suyas (`IncidenciaController`); el gestor las lista y cambia su estado (`AdminController`).
*   **Panel del Gestor:** Métricas de ocupación, calendario de auditoría por cápsula (reservas y accesos), huéspedes activos, reservas futuras, búsqueda y edición de huéspedes, alta de cápsulas y cambio de su estado (`AdminController` y `frontend/src/app/admin`).

---

## 🛠️ 3. Stack Tecnológico

**Backend:**
*   **Java 21:** Última versión LTS (Long Term Support).
*   **Spring Boot 3:** Framework principal (Spring Web, Spring Security, Spring Data JPA).
*   **jjwt & Bcrypt:** Para la gestión de JSON Web Tokens y hashing de contraseñas.
*   **Lombok:** Librería para ahorrarnos escribir boilerplate (código repetitivo) mediante etiquetas como `@Getter` o `@Builder`.
*   **Swagger (OpenAPI):** Documentación interactiva autogenerada de nuestra API.

**Frontend:**
*   **Next.js (React) & TypeScript:** Para la creación de la interfaz de usuario con tipado estático seguro.
*   **Tailwind CSS:** Framework de estilos. Nos permite diseñar interfaces premium ("Glassmorphism", gradientes) de forma ágil escribiendo clases de utilidad.
*   **Lucide React:** Para la iconografía SVG moderna y minimalista.
*   **Fetch API:** Para el consumo de la API REST Backend.

**Testing & Herramientas:**
*   **Cypress:** Pruebas E2E de interfaz de usuario.
*   **Bruno:** Colección de peticiones de la API REST.

---

## 💾 4. Base de Datos H2 (En Memoria)

Para este MVP, hemos integrado **H2**, una base de datos relacional ligera que funciona **completamente en la memoria RAM** (In-Memory Database).

**¿Por qué usamos H2 ahora mismo?**
* **Fricción Cero:** No requiere instalar programas externos (como un servidor MySQL). Al arrancar la aplicación Java, la base de datos nace de cero.
* **Agilidad:** Si cambiamos el modelo de datos, al reiniciar, las tablas se recrean limpias automáticamente gracias a la opción `hibernate.ddl-auto: create-drop`.
* **El Futuro (Escalabilidad):** H2 arranca en modo de compatibilidad PostgreSQL (`MODE=PostgreSQL`) y el driver de PostgreSQL ya está en el `pom.xml`, de modo que pasar a una PostgreSQL persistente consiste en cambiar la configuración (datasource, dialecto de Hibernate y `ddl-auto`), sin tocar los repositorios.

---

## 🚀 5. Guía de Ejecución Local

Para probar la plataforma al completo, necesitas abrir **dos terminales diferentes** en la raíz del proyecto.

### 5.1 Arrancar el Backend (Java)
Abre la primera terminal, entra a la carpeta del backend y usa Maven para arrancar el servidor (requiere JDK 21 y Maven instalados):
```bash
cd backend
mvn spring-boot:run
```
*El servidor backend iniciará en el puerto `8080`.*

### 5.2 Arrancar el Frontend (Next.js)
Abre la segunda terminal, entra a la carpeta del frontend, **instala las dependencias (paso fundamental)** y arranca el entorno de desarrollo:
```bash
cd frontend
npm install
npm run dev
```
*El servidor frontend iniciará en el puerto `3000`.*

### 5.3 Usuarios de demostración y recorrido
Guía para probar la demo rápidamente. Al arrancar, `DataInitializer` precarga dos usuarios, y el login se hace por DNI:

| Rol | DNI | Contraseña |
| --- | --- | --- |
| ADMIN | `12345678A` | `1234` |
| USER | `12345678B` | `1234` |

**Recorrido:**
1. Entra como gestor y da de alta una cápsula con **Añadir Cápsula** en el Portal del Gestor (`/admin/dashboard`). La base de datos arranca sin cápsulas.
2. Cierra sesión, entra como huésped y crea una reserva en **Nueva Reserva** (`/reservations/new`) con fecha de entrada de hoy, ya que el check-in solo se admite a partir de esa fecha.
3. Haz el check-in en **Check-in Digital** (`/checkin`), subiendo una imagen del DNI de 1 MB como máximo y aceptando los términos.
4. Obtén el PIN de 6 dígitos, que aparece al completar el check-in y también en **Mis Reservas** (`/reservations/my`).
5. Abre la cápsula introduciendo el PIN en **Acceso a Cápsula** (`/access`).
6. Haz el check-out en **Check-out Digital** (`/checkout`).

**Alta de gestores:** Desde la pantalla de registro (**Regístrate aquí** en `/login`), marcando **Quiero registrar cuenta de Gestor (Admin)** e introduciendo la clave de gestor que proporciona internamente la empresa (en la demo, `Cocooon14`), la cuenta se crea con rol ADMIN.

---

## 🔗 6. Accesos Rápidos (URLs)

Una vez que ambos servidores estén corriendo, puedes acceder a:

*   🖥️ **Aplicación Web (Frontend):** [http://localhost:3000](http://localhost:3000)
*   ⚙️ **API REST (Backend):** `http://localhost:8080/api/v1/...`
*   📚 **Documentación API (Swagger UI):** [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
*   🗄️ **Consola Base de Datos H2:** [http://localhost:8080/h2-console](http://localhost:8080/h2-console) (JDBC URL: `jdbc:h2:mem:tourist_cocoon`, usuario: `sa`, contraseña vacía)
