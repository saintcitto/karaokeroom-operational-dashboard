import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const Modal = ({ children, onClose, wide = false }) => {
  return (
    <AnimatePresence>
      <motion.div
        key="modal-overlay"
        className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          key="modal-content"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className={`
            relative w-full mx-4 rounded-2xl shadow-2xl 
            bg-white dark:bg-gray-800 
            p-6 sm:p-8
            ${wide ? "max-w-4xl" : "max-w-lg"}
          `}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
            aria-label="Close"
          >
            <X size={22} />
          </button>

          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Modal;
