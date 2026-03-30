// Standard Vite entrypoint.
// Load legacy globals (mock globalContextData) before any module reads COURSEFLOW_APP.
import '@cf/bootstrap'
import './app'
