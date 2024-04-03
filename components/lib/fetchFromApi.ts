"use server"

import emptyGrid from "../../public/empty-grid.json" assert { type: "json" }

const URLS = [
  "https://firebasestorage.googleapis.com/v0/b/sudoku-sandbox.appspot.com/o/{}?alt=media",
  "https://sudokupad.app/api/puzzle/{}"
]

export async function fetchFromApi(id: string): Promise<string> {
  let urls
  if (id === null || id === "") {
    return JSON.stringify(emptyGrid)
  } else {
    urls = URLS.map(url => url.replace("{}", id))
  }

  let response: Response | undefined
  for (let url of urls) {
    response = await fetch(url)
    if (response.status === 200) {
      return response.text()
    }
  }

  if (response === undefined) {
    throw new Error("No puzzle loaded")
  }

  if (response.status === 404) {
    throw new Error(`The puzzle with the ID \u2018${id}’ does not exist`)
  }

  throw new Error(
    `Failed to load puzzle with ID \u2018${id}’. ` +
      `Received HTTP status code ${response.status} from server.`
  )
}
