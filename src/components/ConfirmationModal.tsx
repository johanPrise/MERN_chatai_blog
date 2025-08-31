"use client"

import  React from "react"
import Modal from "react-modal"
import { ConfirmationModalProps } from "../types/ConfirmationModalProps"



/**
 * Renders a confirmation modal for deleting a post.
 *
 * @param {ConfirmationModalProps} props - The props for the confirmation modal.
 * @param {boolean} props.isOpen - Whether the modal is open.
 * @param {() => void} props.onRequestClose - The function to call when the modal is closed.
 * @param {() => void} props.onConfirm - The function to call when the user confirms the deletion.
 * @return {JSX.Element} The confirmation modal component.
 */
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onRequestClose, onConfirm }) => {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={{
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
          zIndex: 1000,
        },
        content: {
          backgroundColor: "white",
          color: "#1F2937",
          border: "none",
          borderRadius: "16px",
          padding: "0",
          width: "420px",
          maxWidth: "90vw",
          margin: "auto",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          outline: "none",
        },
      }}
    >
      <div className="p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-center text-gray-900 mb-2">Supprimer le post</h2>
        <p className="text-gray-600 text-center mb-6">Êtes-vous sûr de vouloir supprimer ce post ? Cette action est irréversible.</p>
        <div className="flex gap-3">
          <button 
            onClick={onRequestClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
          >
            Annuler
          </button>
          <button 
            onClick={onConfirm}
            className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors duration-200"
          >
            Supprimer
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmationModal

