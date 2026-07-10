import assert from "node:assert/strict";
import {
  ENTER_DOT,
  EXIT_DOT,
  facingScore,
  globeTangentVisibilityThreshold,
  passesFacingHysteresis,
} from "../src/lib/globeFacing.ts";

const EPSILON = 1e-12;
const closeTo = (actual, expected, message) => {
  assert.ok(Math.abs(actual - expected) <= EPSILON, `${message}: ${actual}`);
};

assert.equal(ENTER_DOT, 0.50);
assert.equal(EXIT_DOT, 0.42);
closeTo(facingScore({ lat: 12, lng: 34 }, { lat: 12, lng: 34 }), 1, "same point");
closeTo(facingScore({ lat: 0, lng: 0 }, { lat: 0, lng: 180 }), -1, "antipode");
closeTo(facingScore({ lat: 0, lng: 0 }, { lat: 0, lng: 90 }), 0, "90 degrees");
closeTo(facingScore({ lat: 0, lng: 179 }, { lat: 0, lng: -181 }), 1, "wrapped longitude");

const sixtyDegreeScore = facingScore({ lat: 0, lng: 60 }, { lat: 0, lng: 0 });
closeTo(sixtyDegreeScore, 0.5, "60 degrees");
assert.equal(passesFacingHysteresis(sixtyDegreeScore, false), true);
assert.equal(passesFacingHysteresis(0.46, false), false);
assert.equal(passesFacingHysteresis(0.46, true), true);
assert.equal(passesFacingHysteresis(0.40, true), false);
closeTo(
  globeTangentVisibilityThreshold(1.82),
  0.3546099290780142,
  "altitude 1.82 tangent threshold",
);

for (const invalidCall of [
  () => facingScore({ lat: 91, lng: 0 }, { lat: 0, lng: 0 }),
  () => facingScore({ lat: Number.NaN, lng: 0 }, { lat: 0, lng: 0 }),
  () => facingScore({ lat: 0, lng: Number.POSITIVE_INFINITY }, { lat: 0, lng: 0 }),
  () => facingScore({ lat: 0, lng: 0 }, { lat: -91, lng: 0 }),
]) {
  assert.throws(invalidCall, RangeError);
}

console.log("Globe facing score and hysteresis checks passed.");
