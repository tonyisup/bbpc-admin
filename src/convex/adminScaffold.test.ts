import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

async function read(path: string) {
  return await readFile(resolve(process.cwd(), path), "utf8");
}

describe("SQL-default Clerk and Convex admin scaffold", () => {
  test("pins the shared clients and selects providers before rendering", async () => {
    const [packageJsonText, app, authContext, identity] = await Promise.all([
      read("package.json"),
      read("src/pages/_app.tsx"),
      read("src/components/auth/BbpcAdminAuthContext.tsx"),
      read("src/convex/identity.ts"),
    ]);
    const packageJson = JSON.parse(packageJsonText) as {
      dependencies: Record<string, string>;
    };

    expect(packageJson.dependencies["@clerk/nextjs"]).toBe("6.39.6");
    expect(packageJson.dependencies.convex).toBe("1.42.3");
    expect(app).toMatch(
      /NEXT_PUBLIC_BBPC_BACKEND !== "convex"[\s\S]*SessionProvider[\s\S]*SqlBbpcAdminAuthProvider/u
    );
    expect(app).toMatch(
      /ClerkProvider[\s\S]*ConvexProviderWithClerk[\s\S]*ClerkBbpcAdminAuthProvider/u
    );
    expect(identity).toMatch(/identity\/profile:me/u);
    expect(identity).toMatch(/identity\/linking:linkOrCreateMe/u);
    expect(authContext).toMatch(
      /A Clerk subject must never become an application-data ID/u
    );
    expect(authContext).toMatch(/isAdmin: profile\?\.isAdmin \?\? false/u);
  });

  test("keeps unported Convex routes fail-closed", async () => {
    const [middleware, home, sidebar, dashboard, dashboardComponent] =
      await Promise.all([
        read("src/middleware.ts"),
        read("src/pages/index.tsx"),
        read("src/components/layout/Sidebar.tsx"),
        read("src/convex/dashboard.ts"),
        read("src/components/Dashboard/ConvexAdminDashboard.tsx"),
      ]);

    expect(middleware).toMatch(/const convexReadyPages = new Set/u);
    expect(middleware).toMatch(/"\/role"/u);
    expect(middleware).toMatch(/"\/user"/u);
    expect(middleware).toMatch(/status: 503/u);
    expect(middleware).toMatch(/NextResponse\.redirect/u);
    expect(home).toMatch(/enabled: backend === "sql" && isAdmin/u);
    expect(home).toMatch(/<ConvexAdminDashboard userName=\{user\.name\}/u);
    expect(dashboard).toMatch(/admin\/dashboard:overview/u);
    expect(dashboard).toMatch(/dashboardOverviewSchema\.parse/u);
    expect(dashboardComponent).toMatch(
      /No legacy SQL\s+fallback was attempted/u
    );
    expect(dashboardComponent).not.toMatch(/trpc|@prisma/u);
    expect(sidebar).toMatch(/user\?\.isAdmin === true/u);
    expect(sidebar).toMatch(/backend === "convex"/u);
    expect(sidebar).not.toMatch(/trpc\.auth\.isAdmin|useSession/u);
  });

  test("admits roles only through the direct Convex adapter", async () => {
    const [route, roles, rolesComponent] = await Promise.all([
      read("src/pages/role/index.tsx"),
      read("src/convex/roles.ts"),
      read("src/components/Role/ConvexRolesPage.tsx"),
    ]);

    expect(route).toMatch(
      /NEXT_PUBLIC_BBPC_BACKEND === "convex"[\s\S]*return \{ props: \{\} \}[\s\S]*Promise\.all/u
    );
    expect(roles).toMatch(/identity\/admin:listRoles/u);
    expect(roles).toMatch(/identity\/admin:createRole/u);
    expect(roles).toMatch(/identity\/admin:updateRole/u);
    expect(roles).toMatch(/identity\/admin:deleteRole/u);
    expect(roles).toMatch(/roleSummarySchema/u);
    expect(rolesComponent).not.toMatch(/trpc|@prisma|next-auth/u);
  });

  test("admits users only through paginated versioned Convex calls", async () => {
    const [route, users, usersComponent] = await Promise.all([
      read("src/pages/user/index.tsx"),
      read("src/convex/users.ts"),
      read("src/components/User/ConvexUsersPage.tsx"),
    ]);

    expect(route).toMatch(
      /NEXT_PUBLIC_BBPC_BACKEND === "convex"[\s\S]*return \{ props: \{\} \}[\s\S]*Promise\.all/u
    );
    expect(users).toMatch(/identity\/admin:listUsersPage/u);
    expect(users).toMatch(/identity\/admin:setUserStatus/u);
    expect(users).toMatch(/identity\/admin:assignRole/u);
    expect(users).toMatch(/BBPC_CLIENT_API_VERSION/u);
    expect(usersComponent).not.toMatch(/trpc|@prisma|next-auth/u);
    expect(usersComponent).not.toMatch(/deleteConvexAdminUser/u);
  });

  test("admits rating catalog writes only through Convex", async () => {
    const [route, ratings, ratingsComponent] = await Promise.all([
      read("src/pages/rating/index.tsx"),
      read("src/convex/ratings.ts"),
      read("src/components/Rating/ConvexRatingsPage.tsx"),
    ]);

    expect(route).toMatch(
      /NEXT_PUBLIC_BBPC_BACKEND === "convex"[\s\S]*return \{ props: \{\} \}[\s\S]*Promise\.all/u
    );
    expect(ratings).toMatch(/ratings\/admin:list/u);
    expect(ratings).toMatch(/ratings\/admin:removeIfUnreferenced/u);
    expect(ratings).toMatch(/BBPC_CLIENT_API_VERSION/u);
    expect(ratingsComponent).not.toMatch(/trpc|@prisma|next-auth/u);
  });

  test("admits bounded season catalog and detail tools", async () => {
    const [
      middleware,
      route,
      detailRoute,
      seasons,
      details,
      seasonsComponent,
      detailComponent,
    ] = await Promise.all([
      read("src/middleware.ts"),
      read("src/pages/season/index.tsx"),
      read("src/pages/season/[id].tsx"),
      read("src/convex/seasons.ts"),
      read("src/convex/seasonDetails.ts"),
      read("src/components/seasons/ConvexSeasonsPage.tsx"),
      read("src/components/seasons/ConvexSeasonDetailPage.tsx"),
    ]);

    expect(middleware).toMatch(/"\/season"/u);
    expect(middleware).toMatch(/movie\|season\|show/u);
    expect(route).toMatch(/NEXT_PUBLIC_BBPC_BACKEND === "convex"/u);
    expect(detailRoute).toMatch(
      /NEXT_PUBLIC_BBPC_BACKEND === "convex"/u
    );
    expect(seasons).toMatch(/games\/seasons:listPage/u);
    expect(seasons).toMatch(/games\/config:listGameTypes/u);
    expect(seasons).toMatch(/BBPC_CLIENT_API_VERSION/u);
    expect(details).toMatch(/games\/seasons:getPerformance/u);
    expect(details).toMatch(/games\/points:listForSeasonPage/u);
    expect(details).toMatch(/games\/guesses:listForSeasonPage/u);
    expect(details).toMatch(/games\/gambling:listForSeasonPage/u);
    expect(seasonsComponent).not.toMatch(/trpc|@prisma|next-auth/u);
    expect(detailComponent).not.toMatch(/trpc|@prisma|next-auth/u);
  });

  test("admits the complete game configuration catalog through Convex", async () => {
    const [middleware, route, gamblingRoute, gameConfig, gameConfigComponent] =
      await Promise.all([
        read("src/middleware.ts"),
        read("src/pages/game/index.tsx"),
        read("src/pages/gambling/index.tsx"),
        read("src/convex/gameConfig.ts"),
        read("src/components/Game/ConvexGameConfigPage.tsx"),
      ]);

    expect(middleware).toMatch(/"\/game"/u);
    expect(middleware).toMatch(/"\/gambling"/u);
    expect(route).toMatch(
      /NEXT_PUBLIC_BBPC_BACKEND === "convex"[\s\S]*return \{ props: \{\} \}[\s\S]*Promise\.all/u
    );
    expect(gameConfig).toMatch(/games\/config:listGameTypes/u);
    expect(gameConfig).toMatch(/games\/config:listGamePointTypes/u);
    expect(gameConfig).toMatch(/games\/gambling:listTypes/u);
    expect(gameConfig).toMatch(/BBPC_CLIENT_API_VERSION/u);
    expect(gamblingRoute).toMatch(
      /ConvexGameConfigPage defaultTab="gambling-types"/u
    );
    expect(gameConfigComponent).not.toMatch(/trpc|@prisma|next-auth/u);
  });

  test("admits the global syllabus through native Convex pagination", async () => {
    const [middleware, route, syllabus, syllabusComponent] =
      await Promise.all([
        read("src/middleware.ts"),
        read("src/pages/syllabus/index.tsx"),
        read("src/convex/syllabus.ts"),
        read("src/components/Syllabus/ConvexSyllabusPage.tsx"),
      ]);

    expect(middleware).toMatch(/"\/syllabus"/u);
    expect(route).toMatch(
      /NEXT_PUBLIC_BBPC_BACKEND === "convex"[\s\S]*return \{ props: \{\} \}[\s\S]*Promise\.all/u
    );
    expect(syllabus).toMatch(/syllabus\/admin:listPage/u);
    expect(syllabus).toMatch(/syllabus\/admin:removeEntry/u);
    expect(syllabus).toMatch(/BBPC_CLIENT_API_VERSION/u);
    expect(syllabusComponent).not.toMatch(/trpc|@prisma|next-auth/u);
  });

  test("admits tags and paginated votes with explicit award evidence", async () => {
    const [middleware, route, tags, tagsComponent] = await Promise.all([
      read("src/middleware.ts"),
      read("src/pages/tag/index.tsx"),
      read("src/convex/tags.ts"),
      read("src/components/Tag/ConvexTagsPage.tsx"),
    ]);

    expect(middleware).toMatch(/"\/tag"/u);
    expect(route).toMatch(
      /NEXT_PUBLIC_BBPC_BACKEND === "convex"[\s\S]*return \{ props: \{\} \}[\s\S]*Promise\.all/u
    );
    expect(tags).toMatch(/games\/tags:listCatalog/u);
    expect(tags).toMatch(/games\/tags:listVotesPage/u);
    expect(tags).toMatch(/games\/tags:applyVotePoints/u);
    expect(tags).toMatch(/BBPC_CLIENT_API_VERSION/u);
    expect(tagsComponent).toMatch(/legacyAwardTombstone/u);
    expect(tagsComponent).not.toMatch(/trpc|@prisma|next-auth/u);
  });

  test("admits bounded episode catalog and core workbench", async () => {
    const [
      middleware,
      route,
      detailRoute,
      episodes,
      details,
      episodesComponent,
      detailComponent,
    ] =
      await Promise.all([
        read("src/middleware.ts"),
        read("src/pages/episode/index.tsx"),
        read("src/pages/episode/[slug].tsx"),
        read("src/convex/episodes.ts"),
        read("src/convex/episodeDetails.ts"),
        read("src/components/Episode/ConvexEpisodesPage.tsx"),
        read("src/components/Episode/ConvexEpisodeDetailPage.tsx"),
      ]);

    expect(middleware).toMatch(/"\/episode"/u);
    expect(middleware).toMatch(/\^\\\/episode\\\/\[\^\/\]\+\$/u);
    expect(route).toMatch(
      /NEXT_PUBLIC_BBPC_BACKEND === "convex"[\s\S]*return \{ props: \{\} \}[\s\S]*Promise\.all/u
    );
    expect(detailRoute).toMatch(
      /NEXT_PUBLIC_BBPC_BACKEND === "convex"[\s\S]*episodeId: null/u
    );
    expect(episodes).toMatch(/episodes\/public:listPage/u);
    expect(episodes).toMatch(/episodes\/admin:createEpisode/u);
    expect(episodes).toMatch(/BBPC_CLIENT_API_VERSION/u);
    expect(episodes).not.toMatch(/removeEpisode/u);
    expect(details).toMatch(/episodes\/admin:updateEpisode/u);
    expect(details).toMatch(/episodes\/admin:addLink/u);
    expect(details).toMatch(/episodes\/admin:listAudioMessages/u);
    expect(details).toMatch(/episodes\/admin:removeAudioMessage/u);
    expect(episodesComponent).not.toMatch(/trpc|@prisma|next-auth/u);
    expect(detailComponent).not.toMatch(
      /trpc|@prisma|next-auth|UploadDropzone/u
    );
  });

  test("admits bounded movie and show catalogs with safe deletion", async () => {
    const [
      middleware,
      movieRoute,
      showRoute,
      catalog,
      catalogComponent,
    ] = await Promise.all([
      read("src/middleware.ts"),
      read("src/pages/movie/index.tsx"),
      read("src/pages/show/index.tsx"),
      read("src/convex/catalog.ts"),
      read("src/components/Media/ConvexMediaCatalogPage.tsx"),
    ]);

    expect(middleware).toMatch(/"\/movie"/u);
    expect(middleware).toMatch(/"\/show"/u);
    expect(middleware).not.toMatch(/\/movie\/\*/u);
    expect(middleware).not.toMatch(/\/show\/\*/u);
    expect(movieRoute).toMatch(
      /NEXT_PUBLIC_BBPC_BACKEND === "convex"[\s\S]*return \{ props: \{\} \}[\s\S]*Promise\.all/u
    );
    expect(showRoute).toMatch(
      /NEXT_PUBLIC_BBPC_BACKEND === "convex"[\s\S]*return \{ props: \{\} \}[\s\S]*Promise\.all/u
    );
    expect(catalog).toMatch(/catalog\/public:listMoviesPage/u);
    expect(catalog).toMatch(/catalog\/public:listShowsPage/u);
    expect(catalog).toMatch(/catalog\/external:searchMovies/u);
    expect(catalog).toMatch(/catalog\/external:searchShows/u);
    expect(catalog).toMatch(/catalog\/admin:deleteMovie/u);
    expect(catalog).toMatch(/catalog\/admin:deleteShow/u);
    expect(catalog).toMatch(/BBPC_CLIENT_API_VERSION/u);
    expect(catalogComponent).not.toMatch(/trpc|@prisma|next-auth/u);
  });

  test("admits bounded movie and show detail reads on one segment", async () => {
    const [
      middleware,
      movieRoute,
      showRoute,
      mediaDetails,
      detailComponent,
    ] = await Promise.all([
      read("src/middleware.ts"),
      read("src/pages/movie/[id].tsx"),
      read("src/pages/show/[id].tsx"),
      read("src/convex/mediaDetails.ts"),
      read("src/components/Media/ConvexMediaDetailPage.tsx"),
    ]);

    expect(middleware).toMatch(
      /\^\\\/\(\?:movie\|season\|show\)\\\/\[\^\/\]\+\$/u
    );
    expect(movieRoute).toMatch(
      /NEXT_PUBLIC_BBPC_BACKEND === "convex"[\s\S]*return \{ props: \{\} \}[\s\S]*Promise\.all/u
    );
    expect(showRoute).toMatch(
      /NEXT_PUBLIC_BBPC_BACKEND === "convex"[\s\S]*return \{ props: \{\} \}[\s\S]*Promise\.all/u
    );
    expect(mediaDetails).toMatch(/catalog\/admin:getMovieDetail/u);
    expect(mediaDetails).toMatch(/catalog\/admin:getShowDetail/u);
    expect(detailComponent).not.toMatch(/trpc|@prisma|next-auth/u);
  });

  test("admits the bounded ranked-list type catalog through Convex", async () => {
    const [middleware, route, rankingTypes, rankingTypesComponent] =
      await Promise.all([
        read("src/middleware.ts"),
        read("src/pages/admin/ranked-types.tsx"),
        read("src/convex/rankingTypes.ts"),
        read("src/components/Ranking/ConvexRankingTypesPage.tsx"),
      ]);

    expect(middleware).toMatch(/"\/admin\/ranked-types"/u);
    expect(route).toMatch(/NEXT_PUBLIC_BBPC_BACKEND === "convex"/u);
    expect(rankingTypes).toMatch(/rankings\/types:list/u);
    expect(rankingTypes).toMatch(/rankings\/types:create/u);
    expect(rankingTypes).toMatch(/rankings\/types:update/u);
    expect(rankingTypes).toMatch(/rankings\/types:remove/u);
    expect(rankingTypes).toMatch(/BBPC_CLIENT_API_VERSION/u);
    expect(rankingTypesComponent).not.toMatch(/trpc|@prisma|next-auth/u);
  });

  test("admits owner/admin ranked-list dashboards and exact detail paths", async () => {
    const [
      middleware,
      route,
      detailRoute,
      rankedLists,
      listsComponent,
      detailComponent,
    ] = await Promise.all([
      read("src/middleware.ts"),
      read("src/pages/lists/index.tsx"),
      read("src/pages/lists/[id].tsx"),
      read("src/convex/rankedLists.ts"),
      read("src/components/Ranking/ConvexRankedListsPage.tsx"),
      read("src/components/Ranking/ConvexRankedListDetailPage.tsx"),
    ]);

    expect(middleware).toMatch(/"\/lists"/u);
    expect(middleware).toMatch(/\^\\\/lists\\\/\[\^\/\]\+\$/u);
    expect(route).toMatch(/NEXT_PUBLIC_BBPC_BACKEND === "convex"/u);
    expect(detailRoute).toMatch(/NEXT_PUBLIC_BBPC_BACKEND === "convex"/u);
    expect(rankedLists).toMatch(/rankings\/lists:listMine/u);
    expect(rankedLists).toMatch(/rankings\/lists:listAdminPage/u);
    expect(rankedLists).toMatch(/rankings\/lists:updateAccessible/u);
    expect(rankedLists).toMatch(/rankings\/items:upsert/u);
    expect(rankedLists).toMatch(/rankings\/items:move/u);
    expect(rankedLists).toMatch(/BBPC_CLIENT_API_VERSION/u);
    expect(listsComponent).not.toMatch(/trpc|@prisma|next-auth/u);
    expect(detailComponent).not.toMatch(/trpc|@prisma|next-auth/u);
  });

  test("admits bounded reviews with confirmed cascade deletion", async () => {
    const [middleware, route, reviews, reviewsComponent] =
      await Promise.all([
        read("src/middleware.ts"),
        read("src/pages/review/index.tsx"),
        read("src/convex/reviews.ts"),
        read("src/components/Review/ConvexReviewsPage.tsx"),
      ]);

    expect(middleware).toMatch(/"\/review"/u);
    expect(route).toMatch(
      /NEXT_PUBLIC_BBPC_BACKEND === "convex"[\s\S]*return \{ props: \{\} \}[\s\S]*Promise\.all/u
    );
    expect(reviews).toMatch(/reviews\/admin:listPage/u);
    expect(reviews).toMatch(/reviews\/admin:getDeleteImpact/u);
    expect(reviews).toMatch(/expectedImpact/u);
    expect(reviews).toMatch(/BBPC_CLIENT_API_VERSION/u);
    expect(reviewsComponent).not.toMatch(/trpc|@prisma|next-auth/u);
  });

  test("admits bounded Quotabunga moderation with stale-write guards", async () => {
    const [middleware, route, quotabunga, quotabungaComponent] =
      await Promise.all([
        read("src/middleware.ts"),
        read("src/pages/quotabunga/index.tsx"),
        read("src/convex/quotabunga.ts"),
        read("src/components/Quotabunga/ConvexQuotabungaPage.tsx"),
      ]);

    expect(middleware).toMatch(/"\/quotabunga"/u);
    expect(route).toMatch(
      /NEXT_PUBLIC_BBPC_BACKEND === "convex"[\s\S]*return \{ props: \{\} \}[\s\S]*Promise\.all/u
    );
    expect(quotabunga).toMatch(/games\/quotes:listAdminEpisodes/u);
    expect(quotabunga).toMatch(/games\/quotes:listAdminForEpisode/u);
    expect(quotabunga).toMatch(/games\/quotes:randomizeIncluded/u);
    expect(quotabunga).toMatch(/games\/quotes:awardPlacements/u);
    expect(quotabunga).toMatch(/expectedAwards/u);
    expect(quotabunga).toMatch(/expectedAward/u);
    expect(quotabunga).toMatch(/BBPC_CLIENT_API_VERSION/u);
    expect(quotabungaComponent).not.toMatch(
      /trpc|@prisma|next-auth/u
    );
  });

  test("admits paginated Banger CRUD with stale-delete protection", async () => {
    const [middleware, route, bangers, bangersComponent] =
      await Promise.all([
        read("src/middleware.ts"),
        read("src/pages/banger/index.tsx"),
        read("src/convex/bangers.ts"),
        read("src/components/Banger/ConvexBangersPage.tsx"),
      ]);

    expect(middleware).toMatch(/"\/banger"/u);
    expect(route).toMatch(
      /NEXT_PUBLIC_BBPC_BACKEND === "convex"[\s\S]*return \{ props: \{\} \}[\s\S]*Promise\.all/u
    );
    expect(bangers).toMatch(/episodes\/bangers:listAdminPage/u);
    expect(bangers).toMatch(/episodes\/bangers:create/u);
    expect(bangers).toMatch(/episodes\/bangers:update/u);
    expect(bangers).toMatch(/episodes\/bangers:remove/u);
    expect(bangers).toMatch(/expected/u);
    expect(bangers).toMatch(/BBPC_CLIENT_API_VERSION/u);
    expect(bangersComponent).not.toMatch(/trpc|@prisma|next-auth/u);
  });
});
