// Victoria Village Street Festival photo set
import type { ChoirPhoto } from "./index";
import vv1 from "./vv6737.jpg.asset.json";
import vv2 from "./vv6739.jpg.asset.json";
import vv3 from "./vv7234.jpg.asset.json";
import vv4 from "./vv7236.jpg.asset.json";

export const victoriaVillagePhotos: ChoirPhoto[] = [
  { id: "vv-lead-singer", wide: vv1.url, tile: vv1.url, alt: { en: "Club Choir performing on the sidewalk at Victoria Village Street Festival", fr: "Club Choir en performance sur le trottoir au Festival de rue Victoria Village" }, tags: ["montreal", "performance", "group"] },
  { id: "vv-group-singing", wide: vv2.url, tile: vv2.url, alt: { en: "Choir members singing together with their Club Choir binders at Victoria Village", fr: "Choristes chantant ensemble avec leurs cahiers Club Choir à Victoria Village" }, tags: ["montreal", "performance", "group"] },
  { id: "vv-ho-hey-signs", wide: vv3.url, tile: vv3.url, alt: { en: "Volunteer holding hand-painted 'Ho Hey' signs at Victoria Village Street Festival", fr: "Bénévole tenant des affiches peintes à la main « Ho Hey » au Festival Victoria Village" }, tags: ["montreal", "atmosphere"] },
  { id: "vv-smiling-members", wide: vv4.url, tile: vv4.url, alt: { en: "Smiling Club Choir members holding their colourful binders at Victoria Village", fr: "Membres souriants de Club Choir tenant leurs cahiers colorés à Victoria Village" }, tags: ["montreal", "group"] },
];
