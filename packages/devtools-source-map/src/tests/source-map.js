/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at <http://mozilla.org/MPL/2.0/>. */

jest.mock("devtools-utils/src/network-request");
const networkRequest = require("devtools-utils/src/network-request");

const {
  getOriginalURLs,
  hasMappedSource,
  getOriginalLocation,
  clearSourceMaps
} = require("../source-map");

const { setupBundleFixture } = require("./helpers");

describe("source maps", () => {
  beforeEach(() => {
    clearSourceMaps();
  });
  describe("getOriginalURLs", () => {
    test("absolute URL", async () => {
      const urls = await setupBundleFixture("absolute");
      expect(urls).toEqual(["http://example.com/cheese/heart.js"]);
    });

    test("source with a url", async () => {
      const urls = await setupBundleFixture("bundle");
      expect(urls).toEqual([
        "webpack:///webpack/bootstrap 4ef8c7ec7c1df790781e",
        "webpack:///entry.js",
        "webpack:///times2.js",
        "webpack:///output.js",
        "webpack:///opts.js"
      ]);
    });

    test("Empty sourceRoot resolution", async () => {
      const urls = await setupBundleFixture("empty");
      expect(urls).toEqual(["http://example.com/heart.js"]);
    });

    test("Non-existing sourceRoot resolution", async () => {
      const urls = await setupBundleFixture("noroot");
      expect(urls).toEqual(["http://example.com/heart.js"]);
    });

    test("Non-existing sourceRoot resolution with relative URLs", async () => {
      const urls = await setupBundleFixture("noroot2");
      expect(urls).toEqual(["http://example.com/heart.js"]);
    });
  });

  describe("hasMappedSource", async () => {
    test("has original location", async () => {
      await setupBundleFixture("bundle");
      const location = {
        sourceId: "bundle.js",
        line: 49
      };
      const isMapped = await hasMappedSource(location);
      expect(isMapped).toBe(true);
    });

    test("does not have original location", async () => {
      const location = {
        sourceId: "bundle.js",
        line: 94
      };
      const isMapped = await hasMappedSource(location);
      expect(isMapped).toBe(false);
    });
  });

  describe("Error handling", async () => {
    test("missing map", async () => {
      const source = {
        id: "missingmap.js",
        sourceMapURL: "missingmap.js.map",
        url: "http:://example.com/missingmap.js"
      };

      networkRequest.mockImplementationOnce(() => {
        throw new Error("Not found");
      });

      let thrown = false;
      try {
        await getOriginalURLs(source);
      } catch (e) {
        thrown = true;
      }
      expect(thrown).toBe(true);

      const location = {
        sourceId: "missingmap.js",
        line: 49
      };

      thrown = false;
      try {
        await getOriginalLocation(location);
      } catch (e) {
        thrown = true;
      }
      expect(thrown).toBe(false);
    });
  });
});
