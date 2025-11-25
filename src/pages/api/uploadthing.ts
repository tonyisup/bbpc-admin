import { createRouteHandler } from "uploadthing/next-legacy";
import { ourFileRouter } from "../../server/uploadthing/core";

export default createRouteHandler({
  router: ourFileRouter,
});
