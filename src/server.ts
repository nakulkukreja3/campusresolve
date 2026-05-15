export default {
  async fetch() {
    return new Response("CampusResolve server entry is not used on Vercel static deployment.", {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
    });
  },
};
