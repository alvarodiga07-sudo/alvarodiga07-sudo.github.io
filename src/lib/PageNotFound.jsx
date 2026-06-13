import { useLocation } from 'react-router-dom';

const LOGO_URL = "https://media.base44.com/images/public/user_69aea125734ce6b1da596dd5/ce9f50f11_IMG_05283.png";

export default function PageNotFound() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-sm w-full text-center space-y-6">
        <img src={LOGO_URL} alt="Waddle" className="w-16 h-16 mx-auto rounded-2xl opacity-30" />
        <div>
          <h1 className="text-6xl font-light text-muted-foreground/30">404</h1>
          <div className="h-0.5 w-12 bg-primary/20 mx-auto mt-3" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Página no encontrada</h2>
          <p className="text-sm text-muted-foreground mt-2">
            La ruta <span className="font-medium text-foreground">"{location.pathname}"</span> no existe.
          </p>
        </div>
        <button
          onClick={() => window.location.href = '/'}
          className="inline-flex items-center px-5 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}