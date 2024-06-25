import ReactQuill from "react-quill";
import React from "react";

/**
 * Editor component for text editing with specified modules and formats.
 *
 * @param {any} value - The current value of the editor.
 * @param {Function} onChange - The function to be called when the editor content changes.
 * @return {JSX.Element} The React element representing the Editor component.
 */
export default function Editor({ value, onChange } ) {
    const modules = {
        toolbar: [
            [{ header: [1, 2, false] }],
            ["bold", "italic", "underline", "strike", "blockquote"],
            [
                { list: "ordered" },
                { list: "bullet" },
                { indent: "-1" },
                { indent: "+1" },
            ],
            ["link", "image"],
            ["clean"],
        ],
    };
    const formats = [
        "header",
        "bold",
        "italic",
        "underline",
        "strike",
        "blockquote",
        "list",
        "bullet",
        "indent",
        "link",
        "image",
    ];

    return (
<ReactQuill
            value={value}
            theme="snow"
            modules={modules}
            formats={formats}
            onChange={onChange}
            className="h-64 p-2 border-lime-700"
        />
    );
}
