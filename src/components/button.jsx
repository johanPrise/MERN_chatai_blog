import Stack from '@mui/material/Stack';

/**
 * Renders a green button component with the provided button properties.
 *
 * @param {Object} button - The properties of the button.
 * @param {string} button.text - The text to display on the button.
 * @param {string} button.link - The link to navigate to when the button is clicked.
 * @return {JSX.Element} - The rendered green button component.
 */
export default function GreenButton(button) {
    return (
        <Stack spacing={2} direction="row">
            <button
                className="px-4 py-2 rounded-md border border-black bg-green-500 text-white text-sm hover:shadow-[4px_4px_0px_0px_rgba(0,0,0)] transition duration-200"
                src={button.link}
            >
                {button.text}
            </button>
        </Stack>
    );
}
