import React from "react";
import { motion } from "framer-motion";
import FuzzyText from "./LHU_UI/FuzzyText";
import { RefreshCcw } from "lucide-react";

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("💀 System meltdown detected:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-black text-white text-center select-none">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="mb-5 flex text-center justify-center">
                <FuzzyText baseIntensity={0.3} hoverIntensity={0.1} enableHover={false}>500</FuzzyText>
            </div>
            <FuzzyText baseIntensity={0.3} hoverIntensity={0.1} enableHover={false}>
              SYSTEM ERROR
            </FuzzyText>

            <motion.p
              className="mt-4 text-gray-400 text-sm tracking-wider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              Something went wrong. Please reload the system.
            </motion.p>

            <motion.button
              onClick={this.handleReload}
              className="mt-8 inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-gray-900/70 hover:bg-gray-800 border border-gray-700 transition-all"
              whileHover={{ scale: 1.05, rotate: 1 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCcw size={18} /> Restart
            </motion.button>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
