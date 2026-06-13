import { motion } from 'framer-motion';
import styles from './Card.module.css';

const Card = ({ children, className = '', hover = true, padding = true, onClick }) => {
  const Component = onClick ? motion.button : motion.div;
  return (
    <Component
      className={`${styles.card} ${padding ? styles.padded : ''} ${className}`}
      onClick={onClick}
      whileHover={hover ? { y: -2, boxShadow: 'var(--shadow-lg)' } : {}}
      transition={{ duration: 0.2 }}
    >
      {children}
    </Component>
  );
};

export default Card;
