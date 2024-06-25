import React from "react";
import Modal from "react-modal";

interface ConfirmationModalProps {
    isOpen: boolean;
    onRequestClose: () => void;
    onConfirm: () => void;
}

/**
 * Renders a confirmation modal for deleting a post.
 *
 * @param {ConfirmationModalProps} props - The props for the confirmation modal.
 * @param {boolean} props.isOpen - Whether the modal is open.
 * @param {() => void} props.onRequestClose - The function to call when the modal is closed.
 * @param {() => void} props.onConfirm - The function to call when the user confirms the deletion.
 * @return {JSX.Element} The confirmation modal component.
 */
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
                                                                 isOpen,
                                                                 onRequestClose,
                                                                 onConfirm,
                                                             }) => {
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            style={{
                overlay: {
                    backgroundColor: "rgba(0, 0, 0, 0.75)",
                },
                content: {
                    backgroundColor: "#D9E0EA",
                    color: "#1F2937",
                    border: "none",
                    borderRadius: "10px",
                    padding: "20px",
                    width: "400px",
                    margin: "auto",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                },
            }}
        >
            <h2>Supprimer le post</h2>
            <p>Voulez-vous vraiment supprimer ce post ?</p>
            <button onClick={onConfirm}>Oui</button>
            <button onClick={onRequestClose}>Non</button>
        </Modal>
    );
};

export default ConfirmationModal;
