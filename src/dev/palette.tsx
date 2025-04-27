import React, { Fragment } from "react"
import { Category, Component, Variant, Palette } from "@react-buddy/ide-toolbox"
import MUIPalette from "@react-buddy/palette-mui"

/**
 * Palette tree for React Buddy IDE toolbox
 */
export const PaletteTree: React.FC = () => (
  <Palette>
    <Category name="App">
      <Component name="Loader">
        <Variant>
          <ExampleLoaderComponent />
        </Variant>
      </Component>
    </Category>
    <MUIPalette />
  </Palette>
)

/**
 * Example loader component for the palette
 */
export function ExampleLoaderComponent(): React.ReactElement {
  return <Fragment>Loading...</Fragment>
}
