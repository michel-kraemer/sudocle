import emptyGrid from "../../../public/empty-grid.json" assert { type: "json" }

const URLS = [
  "https://firebasestorage.googleapis.com/v0/b/sudoku-sandbox.appspot.com/o/{}?alt=media",
  "https://sudokupad.app/api/puzzle/{}"
]

const MAX_AGE_EMPTY_SECONDS = 1209600 // 14 days
const MAX_AGE_OTHER = 86400 // 1 day

export async function GET(
  _: Request,
  { params }: { params: { id: string[] } }
) {
  try {
    if (params.id === undefined || params.id.length === 0) {
      let r = new Response(JSON.stringify(emptyGrid))
      r.headers.set("cache-control", `max-age=${MAX_AGE_EMPTY_SECONDS}`)
      return r
    }

    let id = params.id.join("/")
    let urls = URLS.map(url => url.replace("{}", id))

    let response: Response | undefined
    for (let url of urls) {
      response = await fetch(url)
      if (response.status === 200) {
        let r = new Response(await response.text())
        r.headers.set("cache-control", `max-age=${MAX_AGE_OTHER}`)
        return r
      }
    }

    if (response === undefined) {
      return new Response("No puzzle loaded", {
        status: 500
      })
    }

    if (response.status === 404) {
      return new Response(
        `The puzzle with the ID \u2018${id}’ does not exist`,
        {
          status: 404
        }
      )
    }

    return new Response(
      `Failed to load puzzle with ID \u2018${id}’. ` +
        `Received HTTP status code ${response.status} from server.`,
      {
        status: 500
      }
    )
  } catch (error) {
    console.error(error)
    return new Response("Internal server error", {
      status: 500
    })
  }
}
