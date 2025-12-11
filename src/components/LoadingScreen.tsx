import { motion, AnimatePresence } from "framer-motion";

export const LoadingScreen: React.FC<{ loading: boolean }> = ( { loading }) => {
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          key="loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="relative items-center justify-center min-h-screen"
        >
          <motion.img
            src="https://media.tenor.com/dIPinX-49CsAAAAi/anime-vtuber.gif"
            alt="Loading..."
            className="relative mx-auto mb-4 w-20 h-20"
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
