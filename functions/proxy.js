const SCORESABER = (id) => { return `https://scoresaber.com/api/player/${id}/basic` };
const BEATLEADER = (id) => { return `https://api.beatleader.xyz/player/${id}?stats=false` };

export async function onRequestGet({ request }) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (type === null || id === null) {
    return new Response(JSON.stringify({ errorMessage: "Not Found" }, null, 2), {
      headers: {
        "Content-Type": "application/json"
      }, status: 404
    });
  }

  const raw = await fetch(type === "scoresaber" ? SCORESABER(id) : BEATLEADER(id));
  const data = await raw.json();
  const json = JSON.stringify(data, null, 2);

  return new Response(json, {
    headers: {
      "content-type": "application/json;charset=UTF-8",
    },
  });
}

