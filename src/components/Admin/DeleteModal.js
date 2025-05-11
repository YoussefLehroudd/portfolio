import React from 'react';
import styles from './DeleteModal.module.css';

const DeleteModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>Confirmation</h2>
        <p>Êtes-vous sûr de vouloir supprimer ce message ?</p>
        <div className={styles.buttons}>
          <button 
            className={`${styles.button} ${styles.cancelButton}`}
            onClick={onClose}
          >
            Annuler
          </button>
          <button 
            className={`${styles.button} ${styles.confirmButton}`}
            onClick={onConfirm}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
