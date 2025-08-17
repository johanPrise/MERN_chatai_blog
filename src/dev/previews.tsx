import React from "react"
import { ComponentPreview, Previews } from "@react-buddy/ide-toolbox"
import { PaletteTree } from "./palette"
import PostPage from "../pages/Post"

/**
 * Component previews for React Buddy IDE toolbox
 */
const ComponentPreviews: React.FC = () => {
  return (
    <Previews palette={<PaletteTree />}>
      <ComponentPreview path="/PostPage">
        <PostPage />
      </ComponentPreview>
    </Previews>
  )
}

export default ComponentPreviews
