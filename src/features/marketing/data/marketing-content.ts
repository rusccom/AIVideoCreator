export const processSteps = [
  {
    title: "Create source visuals",
    text: "Upload a frame, generate a project image, or use a saved asset as a starting point."
  },
  {
    title: "Generate motion",
    text: "Run image-to-video models with a controlled prompt, duration, aspect ratio, and resolution."
  },
  {
    title: "Continue the story",
    text: "The extracted end frame becomes the next start frame for linked scene generation."
  },
  {
    title: "Export the timeline",
    text: "Arrange ready clips into a timeline and render one normalized MP4 export."
  }
];

export const benefits = [
  {
    title: "Endless scene continuation",
    text: "Extract end frames automatically and use them as the next start frame."
  },
  {
    title: "AI Creator scene planning",
    text: "Draft multi-scene sequences from one concept before generation starts."
  },
  {
    title: "Reference image generation",
    text: "Generate production frames from text prompts or existing project images."
  },
  {
    title: "Storyboard Timeline",
    text: "Order ready scenes, track stale clips, and keep project history intact."
  },
  {
    title: "Multi-model video generation",
    text: "Use Grok Imagine, Kling, and Seedance image-to-video model families."
  },
  {
    title: "MP4 timeline export",
    text: "Normalize ready clips and render one stitched video for delivery."
  },
  {
    title: "Credits and payment history",
    text: "Sell generation work with Stripe top-ups and a visible ledger."
  },
  {
    title: "Owner model controls",
    text: "Manage model availability, default settings, and pricing overrides."
  }
];

export const audiences = [
  "Creators",
  "SMM teams",
  "Ad agencies",
  "Brands",
  "Short-film directors",
  "Reels and Shorts authors",
  "Storyboard producers"
];

export const useCases = [
  {
    title: "Fashion spot",
    text: "Turn a lookbook frame into a short campaign sequence."
  },
  {
    title: "Space sequence",
    text: "Build cinematic shots with repeated camera and motion direction."
  },
  {
    title: "Product commercial",
    text: "Prototype product movement, reveals, and social ad variants."
  },
  {
    title: "Music visual",
    text: "Create connected visual loops and export a single timeline."
  },
  {
    title: "Trailer shot",
    text: "Sketch mood, pacing, and scene continuation before production."
  },
  {
    title: "AI character motion",
    text: "Keep a character-driven scene moving across linked clips."
  }
];

export const commercialOffer = {
  title: "Commercial offer for AI video production workflows",
  copy:
    "A browser studio for teams that need repeatable AI video output: generate source images, animate them with multiple image-to-video models, continue scenes from real end frames, and export finished timeline clips.",
  scope: [
    "Private projects with uploaded, generated, extracted, and exported assets",
    "AI Creator flow that drafts multi-scene video sequences from a concept",
    "Text-to-image and reference-image generation for production frames",
    "Image-to-video generation with Grok Imagine, Kling, and Seedance model families",
    "Timeline ordering, stale-scene handling, frame picking, and MP4 export",
    "Credits, Stripe checkout, payment history, and owner-level model pricing controls"
  ],
  metrics: [
    { label: "Video models", value: "5" },
    { label: "Image models", value: "3" },
    { label: "Clip length", value: "2-15s" },
    { label: "Export", value: "MP4" }
  ]
};

export const faqs = [
  {
    question: "How long is one generated clip?",
    answer: "Supported video models currently generate clips from 2 to 15 seconds, depending on the selected model."
  },
  {
    question: "Can a scene continue forever?",
    answer: "You can keep adding linked clips as long as credits, model limits, and storage allow."
  },
  {
    question: "Can I upload my own image?",
    answer: "Yes. Uploaded images become private project assets and can start any scene."
  },
  {
    question: "What happens if I regenerate the middle?",
    answer: "Following clips are marked stale so you can relink, regenerate, or branch from there."
  }
];
