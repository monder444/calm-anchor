import ariaAvatar from '@/assets/therapist-aria.png';
import mayaAvatar from '@/assets/therapist-maya.png';
import noahAvatar from '@/assets/therapist-noah.png';
import lunaAvatar from '@/assets/therapist-luna.png';
import ethanAvatar from '@/assets/therapist-ethan.png';

export interface TherapistPersona {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  avatar: string;
  voiceStyle: string;
  topics: string[];
  greeting: string;
  color: string; // semantic token-friendly
}

export const therapists: TherapistPersona[] = [
  {
    id: 'aria',
    name: 'Aria',
    subtitle: 'Cognitive Behavioral Therapist',
    description: 'Calm and structured — helps you identify patterns and reframe thoughts.',
    avatar: ariaAvatar,
    voiceStyle: 'Calm, elegant, structured',
    topics: ['Anxiety', 'Overthinking', 'Negative thoughts', 'Work pressure', 'Self-esteem'],
    greeting: "Hi, I'm Aria. I can help you explore your thoughts and find clarity today.",
    color: 'primary',
  },
  {
    id: 'maya',
    name: 'Maya',
    subtitle: 'Reflective Therapist',
    description: 'Warm and nurturing — creates a safe space to explore your feelings.',
    avatar: mayaAvatar,
    voiceStyle: 'Gentle, warm, reassuring',
    topics: ['Stress', 'Relationship stress', 'Loneliness', 'Grief', 'Just need to talk'],
    greeting: "Hello, I'm Maya. Whatever you're feeling right now, I'm here to listen.",
    color: 'accent',
  },
  {
    id: 'noah',
    name: 'Noah',
    subtitle: 'Stress Coach',
    description: 'Practical and grounded — helps you break problems into actionable steps.',
    avatar: noahAvatar,
    voiceStyle: 'Grounded, direct, clear',
    topics: ['Stress', 'Work pressure', 'Burnout', 'Decision making', 'Overwhelm'],
    greeting: "Hey, I'm Noah. Let's work through what's on your mind — one step at a time.",
    color: 'secondary',
  },
  {
    id: 'luna',
    name: 'Luna',
    subtitle: 'Mindfulness Guide',
    description: 'Soft and soothing — guides you through breathwork and present-moment awareness.',
    avatar: lunaAvatar,
    voiceStyle: 'Soft, soothing, reflective',
    topics: ['Meditation', 'Sleep', 'Anxiety', 'Grounding', 'Body awareness'],
    greeting: "Hi, I'm Luna. Take a breath with me. Let's find some calm together.",
    color: 'primary',
  },
  {
    id: 'ethan',
    name: 'Ethan',
    subtitle: 'Motivational Coach',
    description: 'Encouraging and confident — builds your momentum and celebrates your wins.',
    avatar: ethanAvatar,
    voiceStyle: 'Confident, warm, energetic',
    topics: ['Motivation', 'Self-esteem', 'Goals', 'Procrastination', 'Confidence'],
    greeting: "Hey there, I'm Ethan. Let's tap into your strength and get moving forward!",
    color: 'accent',
  },
];

export function getTherapist(id: string): TherapistPersona {
  return therapists.find(t => t.id === id) || therapists[0];
}
