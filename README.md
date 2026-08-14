# Tourist Cocoon - Sistema de Gestión de Cápsulas 🏨🛌

¡Bienvenido al repositorio oficial del proyecto **Tourist Cocoon**!

Este proyecto implementa un MVP (Minimum Viable Product) de una plataforma B2B premium para la gestión desatendida, reserva y control de accesos en un hostal automatizado basado en cápsulas. A continuación, te explicamos cómo está estructurado el código, qué tecnologías utilizamos y cómo está pensada la arquitectura para escalar.

---

## 🏗️ 1. Arquitectura General del Sistema

El proyecto sigue una arquitectura clásica **Cliente-Servidor**, dividida en dos grandes bloques completamente independientes que se comunican a través de una API REST.

### Backend (Carpeta `/backend`)
Construido en **Java 21** con el framework **Spring Boot 3**. Sigue una arquitectura limpia y tradicional de 4 capas:
1. **Domain (Modelo de Datos):** Aquí viven nuestras entidades (`Reserva`, `Huesped`, `Capsula`, `RegistroAcceso`). Representan las tablas de nuestra base de datos.
2. **Repository (Capa de Acceso a Datos):** Interfaces que heredan de `JpaRepository`. Se encargan de guardar, buscar y borrar entidades en la base de datos sin tener que escribir SQL manualmente.
3. **Service (Capa de Negocio):** Aquí reside el "cerebro" (ej. `ReservationService`, `CheckInService`). Contiene la lógica compleja y asegura que las reglas de negocio se cumplan.
4. **Controller (Capa de API):** Exponen los endpoints REST (`/api/v1/reservations`, etc.). Reciben las peticiones del frontend en formato JSON, llaman a los Servicios correspondientes y devuelven una respuesta HTTP.

### Frontend (Carpeta `/frontend`)
Construido con **TypeScript**, **React** y el framework **Next.js 14**.
1. **Estructura App Router:** Utiliza el nuevo enrutador de Next.js (`/src/app`). Cada carpeta representa una página (ej. `/checkin/page.tsx`, `/reservations/new/page.tsx`).
2. **Next.js Proxy:** Utilizamos `next.config.js` para redirigir internamente las llamadas `/api/*` hacia nuestro servidor Java. Esto nos evita problemas de seguridad (CORS) directamente en el navegador.
3. **Componentes "Client-Side":** Usamos `"use client"` en la parte superior de las páginas que necesitan interactividad (estados, botones, formularios y peticiones de red).

---

## ⚙️ 2. Core Business Logic & Seguridad (Destacado)

El sistema no es un simple CRUD; implementa reglas de negocio reales y una capa de seguridad para la gestión de la plataforma:

*   **Motor de Restricciones Legales:** Implementación de un algoritmo en el backend que valida y bloquea transacciones que superen los límites de la **Ley de Arrendamientos Urbanos** (máximo 7 noches consecutivas o 15 días mensuales).
*   **Autenticación y Autorización (JWT & RBAC):** Implementación de `JwtAuthenticationFilter` y `SecurityConfig` para proteger endpoints según el rol (ADMIN para gestión de cápsulas, USER para operaciones estándar). Uso de tokens JWT (*stateless*) y cifrado de contraseñas con Bcrypt. Intercepción de peticiones erróneas mediante un `GlobalExceptionHandler`.
*   **Flujo de Check-in Desatendido:** Lógica de negocio que vincula la validación de identidad (DNI/Pasaporte) con la generación algorítmica de un PIN secreto de 6 dígitos para la apertura de la cápsula.

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
*   **Axios / Fetch:** Para el consumo de la API REST Backend.

**Testing & Herramientas:**
*   **Cypress:** Pruebas E2E de interfaz de usuario.
*   **Bruno:** Colecciones de pruebas de integración para la API REST.

---

## 💾 4. Base de Datos H2 (En Memoria)

Para este MVP, hemos integrado **H2**, una base de datos relacional ligera que funciona **completamente en la memoria RAM** (In-Memory Database).

**¿Por qué usamos H2 ahora mismo?**
* **Fricción Cero:** No requiere instalar programas externos (como un servidor MySQL). Al arrancar la aplicación Java, la base de datos nace de cero.
* **Agilidad:** Si cambiamos el modelo de datos, al reiniciar, las tablas se recrean limpias automáticamente gracias a la opción `hibernate.ddl-auto: create-drop`.
* **El Futuro (Escalabilidad):** La configuración en `application.yml` está preparada con perfiles. En un entorno de Producción real, solo bastaría cambiar la URL de conexión hacia una base de datos PostgreSQL persistente, sin tener que alterar el código Java de los repositorios.

---

## 🚀 5. Guía de Ejecución Local

Para probar la plataforma al completo, necesitas abrir **dos terminales diferentes** en la raíz del proyecto.

### 5.1 Arrancar el Backend (Java)
Abre la primera terminal, entra a la carpeta del backend y usa Maven para arrancar el servidor:
```bash
cd backend
./mvnw spring-boot:run
# En Windows puedes usar también: mvnw.cmd spring-boot:run o simplemente mvn spring-boot:run si lo tienes instalado.
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

---

## 🔗 6. Accesos Rápidos (URLs)

Una vez que ambos servidores estén corriendo, puedes acceder a:

*   🖥️ **Aplicación Web (Frontend):** [http://localhost:3000](http://localhost:3000)
*   ⚙️ **API REST (Backend):** `http://localhost:8080/api/v1/...`
*   📚 **Documentación API (Swagger UI):** [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
*   🗄️ **Consola Base de Datos H2:** [http://localhost:8080/h2-console](http://localhost:8080/h2-console) (JDBC URL típica: `jdbc:h2:mem:testdb`)
