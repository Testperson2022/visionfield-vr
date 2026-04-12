import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary — fanger uventede runtime-fejl.
 * Viser venlig fejlbesked i stedet for hvid skærm.
 * SIKKERHED: Viser ALDRIG stack traces eller patientdata til brugeren.
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // SIKKERHED: Log kun fejltype, ALDRIG brugerdata
    console.error("[ErrorBoundary]", error.name, error.message);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Noget gik galt</h2>
            <p className="text-gray-500 mb-4">
              En uventet fejl opstod. Prøv at genindlæse siden.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Genindlæs
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
