
import { createServiceIdentifier } from "@gpk/core/lib/common/instantiation"
export const browser = 1;

export function main() {
  console.log('frontend application');
  console.log("browser", browser)
  console.log("service id : ", createServiceIdentifier(Symbol.for("frontend-application")))
}
