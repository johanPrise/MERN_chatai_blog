import React from "react"
import { ComponentPreview, Previews } from "@react-buddy/ide-toolbox"
import { PaletteTree } from "./palette"
import PostPage from "../pages/Post"
import Editor from "../components/Editor"

/**
 * Component previews for React Buddy IDE toolbox
 */
const ComponentPreviews: React.FC = () => {
  return (
    <Previews palette={<PaletteTree />}>
      <ComponentPreview path="/PostPage">
        <PostPage />
      </ComponentPreview>
      <ComponentPreview path="/Editor">
        <Editor
          value=""
          onChange={(content) => console.log('Editor content changed:', content)}
        />
      </ComponentPreview>
    </Previews>
  )
}

export default ComponentPreviews
