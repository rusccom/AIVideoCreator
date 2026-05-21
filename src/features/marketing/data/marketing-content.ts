export type MarketingCard = {
  title: string;
  text: string;
};

export type ComparisonRow = {
  basic: string;
  director: string;
};

export const heroTags = [
  "Product ads",
  "AI news channels",
  "Social videos",
  "No visible transitions",
  "Story-driven clips",
  "Brand content",
  "Character videos"
];

export const directorOutputs = [
  "Scene plan",
  "Visual style",
  "Camera movement",
  "Connected video flow",
  "Final export"
];

export const creationTypes: MarketingCard[] = [
  {
    title: "Product commercials",
    text: "Create clean product videos, launch clips, comparison ads and premium brand visuals."
  },
  {
    title: "Social media videos",
    text: "Generate Reels, Shorts, TikTok-style clips and vertical campaigns with a clear visual story."
  },
  {
    title: "AI news channels",
    text: "Build news-style episodes, explainers, visual reports and recurring video formats."
  },
  {
    title: "Brand storytelling",
    text: "Turn a simple idea into a sequence of cinematic scenes for your brand or project."
  },
  {
    title: "Digital characters",
    text: "Create videos with AI presenters, mascots, influencers or story characters."
  },
  {
    title: "Trailers & concepts",
    text: "Make cinematic previews, concept videos, mood films and pitch materials."
  }
];

export const problemBenefits: MarketingCard[] = [
  {
    title: "No need to start over every time",
    text: "Continue your video instead of creating unrelated clips."
  },
  {
    title: "One project, one story",
    text: "Keep scenes, prompts, visuals and exports organized in one place."
  },
  {
    title: "Longer videos, clearer structure",
    text: "Build 30-second, 60-second, 2-minute or even longer videos without turning the result into a visible clip montage."
  }
];

export const processSteps: MarketingCard[] = [
  {
    title: "Describe what you want",
    text: "Write your idea in simple words: an ad, a news segment, a product video, a story or a social clip."
  },
  {
    title: "Choose the direction",
    text: "Select the format, mood, style and goal - or let the AI Director decide."
  },
  {
    title: "Get a scene plan",
    text: "The system breaks your idea into connected scenes with camera direction, motion and visual flow."
  },
  {
    title: "Generate and continue",
    text: "Create the first scene, continue the story, adjust any part and export one continuous final video."
  }
];

export const directorFeatures: MarketingCard[] = [
  {
    title: "Smart video planning",
    text: "The system helps turn your raw idea into a clear creative brief."
  },
  {
    title: "Scene-by-scene creation",
    text: "Each part of the video has a purpose: opening, product reveal, action, emotion, message and ending."
  },
  {
    title: "Style consistency",
    text: "Keep the same mood, product, character or world across the whole video without obvious scene breaks."
  },
  {
    title: "Easy corrections",
    text: "Regenerate one scene, change the direction, continue from a better version."
  }
];

export const useCases: MarketingCard[] = [
  {
    title: "Maternity bag commercial",
    text: "\"Create a 45-second ad showing a pregnant woman preparing for the hospital, discovering a ready-made maternity bag, and feeling calm and ready.\""
  },
  {
    title: "AI news episode",
    text: "\"Create a 2-minute visual news segment about the latest technology trends with an AI presenter, studio background and supporting visuals.\""
  },
  {
    title: "Premium product ad",
    text: "\"Create a cinematic commercial for a water bottle with mountain spring visuals, close-up product shots and refreshing lifestyle scenes.\""
  },
  {
    title: "Children's clothing campaign",
    text: "\"Create a warm social media video for baby clothes, showing soft fabrics, family emotions and product details.\""
  },
  {
    title: "YouTube intro sequence",
    text: "\"Create a futuristic intro for a tech channel with a digital host, fast camera movement and cinematic transitions.\""
  },
  {
    title: "Story trailer",
    text: "\"Create a short fantasy trailer with a main character, dramatic atmosphere and connected scenes.\""
  }
];

export const continuityItems: MarketingCard[] = [
  {
    title: "No visible transitions",
    text: "The final video should feel like one continuous piece, not a stitched collection of clips."
  },
  {
    title: "Continue the same product",
    text: "Good for commercials and brand videos."
  },
  {
    title: "Continue the same character",
    text: "Good for presenters, influencers and stories."
  },
  {
    title: "Continue the same world and message",
    text: "Good for trailers, channels, explainers and campaign videos."
  }
];

export const audienceCards: MarketingCard[] = [
  {
    title: "For online stores",
    text: "Create product ads, bundle videos, seasonal campaigns and launch content."
  },
  {
    title: "For marketers",
    text: "Test different creative ideas before spending money on full production."
  },
  {
    title: "For content creators",
    text: "Build long-form visual stories, intros, episodes and channel formats."
  },
  {
    title: "For agencies",
    text: "Prepare client concepts, storyboards and campaign previews faster."
  },
  {
    title: "For AI creators",
    text: "Turn isolated AI generations into complete video projects."
  }
];

export const audiences = audienceCards.map((audience) => audience.title);

export const projectFeatures: MarketingCard[] = [
  {
    title: "Prompt to video plan",
    text: "Start with a simple idea and get a structured direction."
  },
  {
    title: "Scene timeline",
    text: "See your video as connected parts, not separate files."
  },
  {
    title: "Regenerate any scene",
    text: "Improve one moment without throwing away the whole project."
  },
  {
    title: "Export final video",
    text: "Turn your connected scenes into one ready-to-use video without visible transitions."
  }
];

export const comparisonRows: ComparisonRow[] = [
  {
    basic: "Creates one short clip",
    director: "Builds a longer video project"
  },
  {
    basic: "Every prompt starts from zero",
    director: "Scenes continue the same idea"
  },
  {
    basic: "Hard to make a complete ad",
    director: "Designed for ads, stories and episodes"
  },
  {
    basic: "Clips feel separate",
    director: "Video feels like one continuous result"
  },
  {
    basic: "Needs edits to hide the joins",
    director: "Built to reduce visible scene breaks"
  },
  {
    basic: "You manage everything manually",
    director: "AI helps plan the structure"
  }
];

export const faqs: MarketingCard[] = [
  {
    title: "Is this only for short AI clips?",
    text: "No. The system is designed to help you build longer videos from connected scenes."
  },
  {
    title: "Can I create advertising videos?",
    text: "Yes. You can create product ads, brand videos, launch clips and social campaigns."
  },
  {
    title: "Can I make AI news-style videos?",
    text: "Yes. You can create visual news segments, explainers and recurring channel formats."
  },
  {
    title: "Do I need to understand video models or prompts?",
    text: "No. Start with a simple idea. The AI Director helps structure it into scenes and visual direction."
  },
  {
    title: "Can I upload my own image or product photo?",
    text: "Yes. You can start from your own image and build a video around it."
  },
  {
    title: "How long can the video be?",
    text: "You can keep extending the project scene by scene, depending on credits, model limits and storage."
  },
  {
    title: "Will the video look like separate clips?",
    text: "The goal is to make the final export feel like one continuous video without visible transitions between scenes."
  }
];
