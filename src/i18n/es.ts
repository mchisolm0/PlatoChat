import { Translations } from "./en"

const es: Translations = {
  common: {
    appName: "Chatea con tu asistente de IA",
    appTagline: "",
    continue: "",
    ok: "OK",
    cancel: "Cancelar",
    back: "Volver",
  },
  auth: {
    signin: "Iniciar sesión",
    signup: "Registrarse",
    signout: "Cerrar sesión",
    createAccountTitle: "¿Listo para chatear?",
    createAccountSubTitle: "Crea tu cuenta a continuación :)",
    signInTitle: "¡Bienvenido de nuevo!",
    signInSubTitle: "Inicia sesión en tu cuenta a continuación :)",
    email: "Correo electrónico",
    emailPlaceholder: "Insertar correo electrónico",
    verifyEmail: "Verificar correo electrónico",
    verifyEmailPlaceholder: "Ingresa el código de verificación aquí",
    verifyEmailCode: "Enviar código de verificación",
    password: "Contraseña",
    passwordPlaceholder: "Insertar contraseña",
    confirmPassword: "Confirmar contraseña",
    forgotPassword: "¿Olvidaste tu contraseña?",
    resetPassword: "Restablecer contraseña",
    noAccount: "¿No tienes una cuenta?",
    haveAccount: "¿Ya tienes una cuenta?",
  },
  chat: {
    newChat: "Nuevo chat",
    inputPlaceholder: "Escribe tu mensaje",
    send: "Enviar",
    model: "Modelo",
    user: "Yo",
    assistant: "Asistente",
    invalidThreadId: "ID de hilo inválido",
    noMessages: "Aún no hay mensajes",
  },
  settings: {
    settings: "Configuración",
    accountInformation: "Información de la cuenta",
    actions: "Acciones",
    email: "Correo electrónico",
    noEmail: "No se encontró una dirección de correo electrónico",
    emailVerified: "✓ Verificado",
    emailNotVerified: "⚠ No verificado",
    darkMode: "Modo oscuro",
    language: "Idioma",
    system: "Sistema",
    help: "Ayuda",
    about: "Acerca de",
  },
  errorScreen: {
    title: "¡Algo salió mal!",
    friendlySubtitle:
      "Esta es la pantalla que verán tus usuarios en producción cuando haya un error. Vas a querer personalizar este mensaje (que está ubicado en `app/i18n/es.ts`) y probablemente también su diseño (`app/screens/ErrorScreen`). Si quieres eliminarlo completamente, revisa `app/app.tsx` y el componente <ErrorBoundary>.",
    reset: "REINICIA LA APP",
  },
  emptyStateComponent: {
    generic: {
      heading: "Muy vacío... muy triste",
      content:
        "No se han encontrado datos por el momento. Intenta darle clic en el botón para refrescar o recargar la app.",
      button: "Intentemos de nuevo",
    },
  },
}

export default es
