"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { 
  Volume2, VolumeX, Compass, ChevronDown, ChevronLeft, ChevronRight, Activity, Layers, Disc, HelpCircle,
  Calendar, Clock, Trophy, Phone, Shield, ExternalLink, Zap, Users, Info, X, 
  MapPin, Gamepad2, Award, Palette, Music, CircleDot, MessageSquare
} from "lucide-react";

// Web Audio API Synthesizer controller for immersive cinematic drone
class SynthController {
  private ctx: AudioContext | null = null;
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private lfo: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private gain: GainNode | null = null;
  public isPlaying: boolean = false;

  constructor() {}

  start() {
    if (this.isPlaying) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      // Main Gain Node
      this.gain = this.ctx.createGain();
      this.gain.gain.setValueAtTime(0, this.ctx.currentTime);
      // Smooth fade-in
      this.gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 2.5);
      
      // Lowpass Filter with high resonance for sweep effect
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.setValueAtTime(140, this.ctx.currentTime);
      this.filter.Q.setValueAtTime(7, this.ctx.currentTime);
      
      // Osc 1 - Deep sub-octave drone (55Hz / A1)
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = "sine";
      this.osc1.frequency.setValueAtTime(55, this.ctx.currentTime);
      
      // Osc 2 - Mid-range textured wave (110.3Hz / detuned A2)
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = "triangle";
      this.osc2.frequency.setValueAtTime(110.3, this.ctx.currentTime);
      
      // LFO - Very slow breathing modulation (0.15Hz)
      this.lfo = this.ctx.createOscillator();
      this.lfo.type = "sine";
      this.lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime);
      
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(35, this.ctx.currentTime);
      
      // Connections
      this.lfo.connect(lfoGain);
      lfoGain.connect(this.filter.frequency);
      
      this.osc1.connect(this.filter);
      this.osc2.connect(this.filter);
      
      this.filter.connect(this.gain);
      this.gain.connect(this.ctx.destination);
      
      // Start sound
      this.osc1.start();
      this.osc2.start();
      this.lfo.start();
      
      this.isPlaying = true;
    } catch (e) {
      console.error("Failed to start Audio Context:", e);
    }
  }

  stop() {
    if (!this.isPlaying || !this.ctx || !this.gain) return;
    try {
      const now = this.ctx.currentTime;
      this.gain.gain.cancelScheduledValues(now);
      this.gain.gain.setValueAtTime(this.gain.gain.value, now);
      // Smooth fade-out
      this.gain.gain.linearRampToValueAtTime(0, now + 1.2);
      
      const osc1 = this.osc1;
      const osc2 = this.osc2;
      const lfo = this.lfo;
      const filter = this.filter;
      const gain = this.gain;
      const ctx = this.ctx;

      setTimeout(() => {
        try {
          if (osc1) { osc1.stop(); osc1.disconnect(); }
          if (osc2) { osc2.stop(); osc2.disconnect(); }
          if (lfo) { lfo.stop(); lfo.disconnect(); }
          if (filter) filter.disconnect();
          if (gain) gain.disconnect();
          if (ctx) ctx.close();
        } catch (e) {
          console.error("Error cleaning up audio nodes:", e);
        }
      }, 1300);
      
      this.isPlaying = false;
    } catch (e) {
      console.error("Failed to stop Audio Context:", e);
      this.isPlaying = false;
    }
  }

  updateFrequency(progress: number) {
    if (!this.isPlaying || !this.ctx || !this.filter) return;
    // Core peak mapping: peaks at center of scroll (0.5), which is the exploded core phase
    const coreFactor = Math.sin(progress * Math.PI); // Curve going 0 -> 1 -> 0
    const targetFreq = 140 + coreFactor * 420; // range: 140Hz to 560Hz
    this.filter.frequency.setValueAtTime(targetFreq, this.ctx.currentTime);
  }
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  depth: number;
}

// Complete database of events from the Pillai Euforia 2026 Brochure
const EVENTS_DATA = [
  // STAGE EVENTS
  {
    id: "solo-dance",
    name: "Solo Dance",
    category: "Stage Event",
    fee: "₹200",
    prize1: "₹3000",
    prize2: "₹1000",
    timeLimit: "3 minutes",
    rules: [
      "Time Limit: 3 minutes.",
      "Music/Language: No restriction.",
      "Vulgar or obscene costumes are strictly prohibited.",
      "Music tracks must be submitted 2 days before the event."
    ],
    schedule: "January 22, 11:30 AM - 1:30 PM",
    coordinators: "Prathamesh (+91 9967294237)"
  },
  {
    id: "duet-dance",
    name: "Duet Dance",
    category: "Stage Event",
    fee: "₹300",
    prize1: "₹3000",
    prize2: "₹1000",
    timeLimit: "3 minutes",
    rules: [
      "Time Limit: 3 minutes.",
      "Music/Language: No restriction.",
      "Vulgar or obscene costumes are strictly prohibited.",
      "Both partners must perform. Track must be submitted in advance."
    ],
    schedule: "January 22, 11:30 AM - 1:30 PM",
    coordinators: "Prathamesh (+91 9967294237)"
  },
  {
    id: "group-dance",
    name: "Group Dance",
    category: "Stage Event",
    fee: "₹1000",
    prize1: "₹6000",
    prize2: "₹3000",
    timeLimit: "5 minutes",
    teamSize: "8 to 15 members",
    rules: [
      "Time Limit: 5 minutes.",
      "Team Size: 8 to 15 members.",
      "Music/Language: No restriction.",
      "Vulgar or obscene costumes are strictly prohibited."
    ],
    schedule: "January 23, 2:00 PM - 3:30 PM",
    coordinators: "Sarthak (+91 9209498788)"
  },
  {
    id: "rapping",
    name: "Rapping Battle",
    category: "Stage Event",
    fee: "₹150",
    prize1: "₹2000",
    prize2: "₹1000",
    timeLimit: "2 minutes",
    rules: [
      "Time Limit: 2 minutes.",
      "Languages Allowed: Hindi, English, Marathi.",
      "Sledging or abusive language is strictly prohibited.",
      "Participants must submit a copy of their lyrics before the performance."
    ],
    schedule: "January 22, 1:30 PM - 3:00 PM",
    coordinators: "Fatema (+91 7028686952)"
  },
  {
    id: "singing",
    name: "Solo & Duet Singing",
    category: "Stage Event",
    fee: "₹200 (Solo) / ₹300 (Duet)",
    prize1: "₹2500",
    prize2: "₹1000",
    timeLimit: "2 minutes",
    rules: [
      "Time Limit: 2 minutes.",
      "Language: No restriction.",
      "Sledging or abusive language is strictly prohibited.",
      "Both participants must sing during Duet performance.",
      "Participants must arrange their own guitar or keyboard, if required."
    ],
    schedule: "January 23, 10:30 AM - 12:00 PM",
    coordinators: "Hardik (+91 9321676993)"
  },
  {
    id: "mr-ms-euforia",
    name: "Mr. & Ms. Euforia",
    category: "Stage Event",
    fee: "₹300",
    prize1: "₹2000 (Each)",
    rules: [
      "Languages Allowed: Hindi, English, Marathi.",
      "Round 1: Introduction and Walk.",
      "Round 2: Talent Round (Time Limit: 1 minute).",
      "Round 3: Question and Answer.",
      "Vulgar or obscene costumes are strictly prohibited."
    ],
    schedule: "January 22, 3:00 PM - 5:00 PM",
    coordinators: "Fatema (+91 7028686952)"
  },
  {
    id: "war-of-dj",
    name: "War of DJs",
    category: "Stage Event",
    fee: "₹500",
    prize1: "₹3000",
    timeLimit: "7 minutes",
    rules: [
      "Time Limit: 7 minutes.",
      "Previously mixed music is not allowed.",
      "Pen drives and CDs are allowed.",
      "The mixing console will be provided by the organizers."
    ],
    schedule: "January 22, 5:30 PM - 6:30 PM",
    coordinators: "Hardik (+91 9321676993)"
  },
  {
    id: "euforia-classic",
    name: "Euforia Classic (Bodybuilding)",
    category: "Stage Event",
    fee: "₹200",
    prize1: "₹3000",
    prize2: "₹1500",
    rules: [
      "Categories: Below 65 kg & Above 65 kg.",
      "Bodybuilding shorts are compulsory (Board shorts not allowed).",
      "Mandatory bodybuilding poses will be part of the competition.",
      "Participants must bring their own tanning cream and oil."
    ],
    schedule: "January 23, 12:00 PM - 1:30 PM",
    coordinators: "Prathamesh (+91 9967294237)"
  },
  {
    id: "fashion-show",
    name: "Fashion Show",
    category: "Stage Event",
    fee: "₹1000",
    prize1: "₹8000",
    prize2: "₹4000",
    timeLimit: "8 minutes",
    teamSize: "8 to 10 members",
    rules: [
      "Time Limit: 8 minutes.",
      "Team Size: 8 to 10 members.",
      "Each team must have its own theme & ensure cohesive presentation.",
      "Only 2 coordinators from each team allowed backstage for assistance.",
      "Teams must clear the stage immediately after performance."
    ],
    schedule: "January 23, 4:00 PM - 5:00 PM",
    coordinators: "Sarthak (+91 9209498788)"
  },

  // OUTDOOR SPORTS
  {
    id: "football",
    name: "Football (Boys)",
    category: "Outdoor Sport",
    fee: "₹1000",
    prize1: "₹8000",
    prize2: "₹4000",
    teamSize: "10 players (7 on-field + 3 substitutes)",
    rules: [
      "Match Format: 7 vs 7 on ground field.",
      "Players must wear canvas or stud shoes.",
      "Barefoot play is strictly prohibited.",
      "Knockout format matches.",
      "In case of a tie, the winner will be decided by 3 penalty shots."
    ],
    schedule: "January 22, 11:30 AM Onwards",
    coordinators: "Sarthak (+91 9619267166)"
  },
  {
    id: "badminton",
    name: "Badminton (Solo)",
    category: "Outdoor Sport",
    fee: "₹200",
    prize1: "₹2000",
    prize2: "₹1000",
    rules: [
      "Category: Individual (Solo) Singles.",
      "Matches conducted as per Standard Badminton Federation Rules.",
      "The player who first reaches 11 points wins."
    ],
    schedule: "January 22, 11:30 AM Onwards",
    coordinators: "Sunny (+91 7276622005)"
  },
  {
    id: "sprint-100m",
    name: "100m Sprint",
    category: "Outdoor Sport",
    fee: "₹100",
    prize1: "₹1000",
    prize2: "₹500",
    rules: [
      "Category: Individual (Solo).",
      "No false starts; one false start leads to disqualification.",
      "Runners must stay within their assigned lanes.",
      "Running shoes or spikes allowed; barefoot running not permitted."
    ],
    schedule: "January 22, 11:30 AM - 12:30 PM",
    coordinators: "Sarthak (+91 9619267166)"
  },
  {
    id: "relay-4x100",
    name: "4x100m Relay (Boys)",
    category: "Outdoor Sport",
    fee: "₹200",
    prize1: "₹2000",
    prize2: "₹1000",
    teamSize: "4 runners",
    rules: [
      "Team Size: 4 runners per team.",
      "No false starts; one false start leads to disqualification.",
      "Baton exchange must be in the designated zone.",
      "Teams must remain within their assigned lanes.",
      "Running shoes or spikes allowed; barefoot running not permitted."
    ],
    schedule: "January 22, 1:00 PM - 2:00 PM",
    coordinators: "Sarthak (+91 9619267166)"
  },
  {
    id: "shotput",
    name: "Shot Put (Boys)",
    category: "Outdoor Sport",
    fee: "₹100",
    prize1: "₹1000",
    prize2: "₹500",
    rules: [
      "Category: Individual (Solo). Weight: 7 kg.",
      "Each participant gets three attempts; best throw considered.",
      "Event follows Standard Shot Put Rules."
    ],
    schedule: "January 22, 11:30 AM - 1:00 PM",
    coordinators: "Sunny (+91 7276622005)"
  },
  {
    id: "kabaddi",
    name: "Kabaddi (Boys)",
    category: "Outdoor Sport",
    fee: "₹700",
    prize1: "₹5000",
    prize2: "₹2500",
    teamSize: "10 players (7 on-field + 3 substitutes)",
    rules: [
      "Match Time: 10 minutes per half.",
      "Matches played on a soil ground.",
      "Proper Kabaddi kit is mandatory.",
      "Rules as per Standard Kabaddi Association."
    ],
    schedule: "January 22, 11:30 AM Onwards",
    coordinators: "Sarthak (+91 9619267166)"
  },
  {
    id: "volleyball",
    name: "Volleyball (Boys)",
    category: "Outdoor Sport",
    fee: "₹700",
    prize1: "₹4000",
    prize2: "₹2000",
    teamSize: "9 players (6 on-court + 3 substitutes)",
    rules: [
      "Format: Best of 3 sets (15 points per set).",
      "Matches follow Standard Volleyball Federation Rules."
    ],
    schedule: "January 22, 11:30 AM Onwards",
    coordinators: "Sunny (+91 7276622005)"
  },
  {
    id: "box-cricket",
    name: "Box Cricket (Boys)",
    category: "Outdoor Sport",
    fee: "₹700",
    prize1: "₹6000",
    prize2: "₹3000",
    teamSize: "9 players (6 on-field + 3 substitutes)",
    rules: [
      "Format: 4 overs per inning.",
      "One bowler can bowl a maximum of 2 overs.",
      "Only wooden bats allowed (no plastic or fiber bats)."
    ],
    schedule: "January 23, 11:30 AM Onwards",
    coordinators: "Sarthak (+91 9619267166)"
  },
  {
    id: "basketball",
    name: "Basketball (Boys)",
    category: "Outdoor Sport",
    fee: "₹700",
    prize1: "₹4000",
    prize2: "₹2000",
    teamSize: "4 players (3 on-court + 1 substitute)",
    rules: [
      "Match Format: Half-court setup with one basket.",
      "First team to reach 21 points or lead after 10 minutes wins.",
      "Proper basketball kit and shoes are mandatory.",
      "Possession changes after every scored basket.",
      "Points system follows FIBA rules."
    ],
    schedule: "January 23, 11:30 AM Onwards",
    coordinators: "Sunny (+91 7276622005)"
  },
  {
    id: "tug-of-war",
    name: "Tug of War (Boys)",
    category: "Outdoor Sport",
    fee: "₹500",
    prize1: "₹3000",
    teamSize: "5 players",
    rules: [
      "Format: Best of 3 pulls.",
      "Total Weight Limit: 350 kg.",
      "Players must wear sports shoes and proper attire.",
      "Gloves and Tapes allowed for better grip.",
      "Rules as per Standard Tug of War Association."
    ],
    schedule: "January 23, 11:30 AM Onwards",
    coordinators: "Sarthak (+91 9619267166)"
  },

  // INDOOR SPORTS
  {
    id: "benchpress",
    name: "Benchpress (Boys)",
    category: "Indoor Sport",
    fee: "₹200",
    prize1: "₹1000",
    prize2: "₹500",
    rules: [
      "Categories: Under 55 kg | Under 65 kg | Open.",
      "3 attempts to perform the lift.",
      "Clear single complete repetition counts. Bar must move parallel.",
      "Feet must remain flat on the ground. Gloves not allowed."
    ],
    schedule: "January 22, 11:30 AM - 1:00 PM (Gymkhana)",
    coordinators: "Vedant (+91 7666328626)"
  },
  {
    id: "deadlift",
    name: "Deadlift (Boys)",
    category: "Indoor Sport",
    fee: "₹200",
    prize1: "₹1000",
    prize2: "₹500",
    rules: [
      "Categories: Under 55 kg | Under 65 kg | Open.",
      "3 attempts; best successful lift considered.",
      "Lift completed with straight, locked knees & hips, shoulders back at top.",
      "No downward motion allowed before the 'Down' command.",
      "Chalk & lifting belt allowed; straps & gloves prohibited."
    ],
    schedule: "January 22, 1:30 PM - 3:30 PM (Gymkhana)",
    coordinators: "Vedant (+91 7666328626)"
  },
  {
    id: "carrom",
    name: "Carrom",
    category: "Indoor Sport",
    fee: "₹200",
    prize1: "₹1000",
    prize2: "₹500",
    rules: [
      "Categories: Singles and Doubles.",
      "Matches follow Standard Carrom Federation Rules."
    ],
    schedule: "January 23, 11:30 AM - 2:30 PM",
    coordinators: "Vedant (+91 7666328626)"
  },
  {
    id: "chess-indoor",
    name: "Chess (Indoor)",
    category: "Indoor Sport",
    fee: "₹200",
    prize1: "₹2000",
    prize2: "₹1000",
    rules: [
      "Category: Individual (Solo) OPEN.",
      "Match Time: 15 minutes per player.",
      "Matches follow Standard FIDE Rules."
    ],
    schedule: "January 23, 11:30 AM - 12:30 PM",
    coordinators: "Vedant (+91 7666328626)"
  },
  {
    id: "table-tennis",
    name: "Table Tennis",
    category: "Indoor Sport",
    fee: "₹200",
    prize1: "₹1500",
    prize2: "₹750",
    rules: [
      "Format: Best of 3 games, each played to 11 points.",
      "Service alternates every 2 points.",
      "Matches follow Standard Table Tennis Federation Rules."
    ],
    schedule: "January 23, 11:30 AM - 1:00 PM (Gymkhana)",
    coordinators: "Vedant (+91 7666328626)"
  },
  {
    id: "treasure-hunt",
    name: "Treasure Hunt",
    category: "Indoor Sport",
    fee: "₹500",
    prize1: "₹3000",
    teamSize: "5 members",
    rules: [
      "Clues scattered across campus. Each clue contains a riddle.",
      "Participants must not share clues.",
      "Damaging, tearing, or misplacing any clue leads to disqualification.",
      "No interfering with other teams."
    ],
    schedule: "January 23, 11:00 AM - 4:00 PM (All Campus)",
    coordinators: "Vedant (+91 7666328626)"
  },

  // E-SPORTS
  {
    id: "valorant",
    name: "Valorant (PC)",
    category: "E-Sports",
    fee: "₹500",
    prize1: "₹5000",
    prize2: "₹3000",
    teamSize: "5 players",
    rules: [
      "Game Mode: Competitive.",
      "Map selection and side choice decided by coordinators.",
      "Hacks, scripts, or external assists lead to instant ban."
    ],
    schedule: "January 21, 6:30 PM Onwards (Online)",
    coordinators: "Parikshit (+91 9975347607)"
  },
  {
    id: "cs2",
    name: "Counter-Strike 2",
    category: "E-Sports",
    fee: "₹200",
    prize1: "₹2000",
    prize2: "₹1000",
    teamSize: "5 players",
    rules: [
      "Game Mode: Competitive.",
      "Map selection and side choice decided by coordinators.",
      "Standard competitive tournament rules apply."
    ],
    schedule: "January 22, 6:30 PM Onwards (Online)",
    coordinators: "Parikshit (+91 9975347607)"
  },
  {
    id: "chess-online",
    name: "Chess Online",
    category: "E-Sports",
    fee: "₹100",
    prize1: "₹1000",
    prize2: "₹500",
    rules: [
      "Played on chess.com.",
      "Time Control: 10 minutes (Rapid).",
      "Strict anti-cheat protocols. No external engine assistance."
    ],
    schedule: "January 23, 10:30 AM - 12:00 PM (Online)",
    coordinators: "Parikshit (+91 9975347607)"
  },
  {
    id: "freefire",
    name: "FreeFire Max",
    category: "E-Sports",
    fee: "₹200",
    prize1: "₹2500",
    prize2: "₹1250",
    teamSize: "Squad (4 players)",
    rules: [
      "Game Mode: Battle Royale.",
      "Custom rooms monitored by coordinators.",
      "Emulators strictly prohibited."
    ],
    schedule: "January 23, 11:00 AM - 3:00 PM (PHCET Reception)",
    coordinators: "Parikshit (+91 9975347607)"
  },
  {
    id: "ludo-king",
    name: "Ludo King",
    category: "E-Sports",
    fee: "₹100",
    prize1: "₹1000",
    prize2: "₹500",
    rules: [
      "Game Mode: Online Match (4-player lobby).",
      "Standard Ludo King rules apply.",
      "Screenshots of victory must be submitted to coordinators."
    ],
    schedule: "January 23, 12:45 PM - 1:45 PM",
    coordinators: "Parikshit (+91 9975347607)"
  },
  {
    id: "uno-mobile",
    name: "UNO Mobile",
    category: "E-Sports",
    fee: "₹100",
    prize1: "₹1000",
    prize2: "₹500",
    rules: [
      "Standard UNO rules. Each player starts with 7 cards.",
      "Disconnecting intentionally will lead to disqualification.",
      "No game-delaying tactics."
    ],
    schedule: "January 22, 11:30 AM - 12:30 PM",
    coordinators: "Parikshit (+91 9975347607)"
  },
  {
    id: "game-2048",
    name: "2048 Mobile",
    category: "E-Sports",
    fee: "₹100",
    prize1: "₹1000",
    prize2: "₹500",
    rules: [
      "Classic 4x4 Grid.",
      "First to reach 2048 wins.",
      "No undo option allowed; game ends when no moves are possible."
    ],
    schedule: "January 22, 1:00 PM - 2:00 PM",
    coordinators: "Parikshit (+91 9975347607)"
  },
  {
    id: "stumble-guys",
    name: "Stumble Guys",
    category: "E-Sports",
    fee: "₹100",
    prize1: "₹1000",
    prize2: "₹500",
    rules: [
      "Online Knockout format.",
      "Last player standing in the final round wins.",
      "Standard matchmaking rules."
    ],
    schedule: "January 23, 11:00 AM - 1:30 PM",
    coordinators: "Parikshit (+91 9975347607)"
  },
  {
    id: "eight-ball-pool",
    name: "8 Ball Pool",
    category: "E-Sports",
    fee: "₹100",
    prize1: "₹1000",
    prize2: "₹500",
    rules: [
      "Game Mode: 1v1 Online Match.",
      "Standard 8 Ball Pool rules apply."
    ],
    schedule: "January 23, 2:00 PM - 3:00 PM",
    coordinators: "Parikshit (+91 9975347607)"
  },

  // ARTS
  {
    id: "rangoli",
    name: "Rangoli",
    category: "Creative Arts",
    fee: "₹100",
    prize1: "₹500",
    prize2: "₹300",
    rules: [
      "All art events are individual (solo).",
      "Participants must bring their own materials.",
      "Topic announced on the spot.",
      "Must complete within time limit."
    ],
    schedule: "January 22, 11:30 AM - 1:30 PM (3rd Floor PHCOA)",
    coordinators: "Parikshit (+91 9975347607)"
  },
  {
    id: "mehandi",
    name: "Mehandi Art",
    category: "Creative Arts",
    fee: "₹100",
    prize1: "₹500",
    prize2: "₹300",
    rules: [
      "Individual (solo) competition.",
      "Participants must bring their own cones.",
      "Judging based on neatness, design complexity, and creativity."
    ],
    schedule: "January 22, 11:30 AM - 12:30 PM (2nd Floor PHIMSR)",
    coordinators: "Parikshit (+91 9975347607)"
  },
  {
    id: "glass-painting",
    name: "Glass Painting",
    category: "Creative Arts",
    fee: "₹100",
    prize1: "₹500",
    prize2: "₹300",
    rules: [
      "Solo competition. Bring your own glass & paints.",
      "Time limit: 2 hours.",
      "Themes will be given on the spot."
    ],
    schedule: "January 22, 1:30 PM - 3:30 PM (3rd Floor PHCOA)",
    coordinators: "Parikshit (+91 9975347607)"
  },
  {
    id: "drawing",
    name: "Drawing & Sketching",
    category: "Creative Arts",
    fee: "₹100",
    prize1: "₹500",
    prize2: "₹300",
    rules: [
      "Drawing papers will be provided.",
      "Bring your own pencils, colors, and brushes.",
      "Completed artwork must be submitted within the time limit."
    ],
    schedule: "January 23, 10:30 AM - 12:30 PM (7th Floor PHCOA)",
    coordinators: "Parikshit (+91 9975347607)"
  },
  {
    id: "nail-art",
    name: "Nail Art",
    category: "Creative Arts",
    fee: "₹100",
    prize1: "₹500",
    prize2: "₹300",
    rules: [
      "Solo competition.",
      "Bring all nail polish and detailing tools.",
      "No pre-designed decals allowed."
    ],
    schedule: "January 23, 10:30 AM - 12:00 PM (2nd Floor PHIMSR)",
    coordinators: "Parikshit (+91 9975347607)"
  },
  {
    id: "freestyle-dance",
    name: "Freestyle Dance Battle",
    category: "Creative Arts",
    fee: "₹200",
    prize1: "₹2000",
    prize2: "₹1000",
    rules: [
      "Team Size: Solo (1 player).",
      "Each participant will get 1 minute per round to perform.",
      "Music of different genres will be played on the spot by coordinators.",
      "Use of accessories/props is permitted."
    ],
    schedule: "January 23, 2:30 PM - 4:30 PM (3rd Floor PHCOA)",
    coordinators: "Parikshit (+91 9975347607)"
  }
];

const CATEGORIES_LIST = [
  {
    id: "stage-theater",
    title: "Stage & Theater",
    subtitle: "Pillai Quad",
    image: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=800&auto=format&fit=crop",
    desc: "Grand stage performances, dance battles, and fashion showcases."
  },
  {
    id: "vocal-beats",
    title: "Vocal & Beats",
    subtitle: "Auditorium",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop",
    desc: "Solo & duet singing, high energy rapping battles, and DJ face-offs."
  },
  {
    id: "outdoor-athletics",
    title: "Outdoor Athletics",
    subtitle: "Festival Ground",
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800&auto=format&fit=crop",
    desc: "Football, Badminton, Sprint runs, Kabaddi, Volleyball, and Cricket."
  },
  {
    id: "indoor-battles",
    title: "Indoor Battles",
    subtitle: "Gymkhana",
    image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=800&auto=format&fit=crop",
    desc: "Power deadlifts, benchpress, chess, carrom, and table tennis."
  },
  {
    id: "esports",
    title: "Esports Arena",
    subtitle: "PC Gaming Lab",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop",
    desc: "High stakes competitive gaming in BGMI, Valorant, and FreeFire."
  },
  {
    id: "casual-gaming",
    title: "Casual Gaming",
    subtitle: "Mobile Hub",
    image: "https://images.unsplash.com/photo-1612287230202-1bf1d85d1bdf?q=80&w=800&auto=format&fit=crop",
    desc: "Fun, engaging battles in Ludo King, UNO Mobile, Stumble Guys, and 2048."
  },
  {
    id: "creative-canvas",
    title: "Creative Canvas",
    subtitle: "PHCOA Floors",
    image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=800&auto=format&fit=crop",
    desc: "Traditional rangoli, mehandi design, and glass painting."
  }
];

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const synthRef = useRef<SynthController | null>(null);

  // States
  const [loading, setLoading] = useState(true);
  const [loadPercentage, setLoadPercentage] = useState(0);
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [soundOn, setSoundOn] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Interactive UI States for Pillai Euforia
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [regForm, setRegForm] = useState({ name: "", phone: "", college: "", age: "" });
  const [regSubmitted, setRegSubmitted] = useState(false);
  const [sportsTab, setSportsTab] = useState<string>("stage");
  const [showCategories, setShowCategories] = useState(true);
  const [showRegForm, setShowRegForm] = useState(false);
  const [afterMovieYear, setAfterMovieYear] = useState<"2025" | "2024" | "2023">("2025");
  const [categoryIndex, setCategoryIndex] = useState(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRegForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.name || !regForm.phone || !regForm.college || !regForm.age) {
      alert("Please fill all fields!");
      return;
    }
    setRegSubmitted(true);
  };

  const getFilteredEvents = (catId: string) => {
    switch (catId) {
      case "stage-theater":
        return EVENTS_DATA.filter((ev) => ev.category === "Stage Event" && (ev.id.includes("dance") || ev.id === "fashion-show" || ev.id === "mr-ms-euforia"));
      case "vocal-beats":
        return EVENTS_DATA.filter((ev) => ev.category === "Stage Event" && (ev.id === "singing" || ev.id === "rapping" || ev.id === "war-of-dj"));
      case "outdoor-athletics":
        return EVENTS_DATA.filter((ev) => ev.category === "Outdoor Sport");
      case "indoor-battles":
        return EVENTS_DATA.filter((ev) => ev.category === "Indoor Sport");
      case "esports":
        return EVENTS_DATA.filter((ev) => ev.category === "E-Sports" && (ev.id === "bgmi" || ev.id === "valorant" || ev.id === "freefire"));
      case "casual-gaming":
        return EVENTS_DATA.filter((ev) => ev.category === "E-Sports" && (ev.id !== "bgmi" && ev.id !== "valorant" && ev.id !== "freefire"));
      case "creative-canvas":
        return EVENTS_DATA.filter((ev) => ev.category === "Creative Arts");
      default:
        return [];
    }
  };

  // Refs for tracking animation variables inside the rAF loop (to bypass react render lag)
  const scrollInfo = useRef({
    progress: 0,
    targetFrame: 1,
    currentFrame: 1,
    mouseX: 0,
    mouseY: 0,
    targetMouseX: 0,
    targetMouseY: 0,
  });

  // Framer Motion scroll hooks
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Listen to scroll to update target frame and active navigation stage
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    scrollInfo.current.progress = latest;
    // Map progress to [1, 120] frame index
    scrollInfo.current.targetFrame = Math.max(1, Math.min(120, Math.floor(latest * 120) + 1));
    
    // Update synthesizer filter sweep based on scroll position
    if (synthRef.current && synthRef.current.isPlaying) {
      synthRef.current.updateFrequency(latest);
    }

    // Determine current section/stage index
    if (latest < 0.22) {
      setCurrentStage(0);
    } else if (latest >= 0.22 && latest < 0.52) {
      setCurrentStage(1);
    } else if (latest >= 0.52 && latest < 0.82) {
      setCurrentStage(2);
    } else {
      setCurrentStage(3);
    }
  });


  // Preload all 120 images
  useEffect(() => {
    const totalFrames = 120;
    const loadedImages: HTMLImageElement[] = [];
    let loadedCount = 0;

    // Initialize audio controller
    synthRef.current = new SynthController();

    const preloadImages = async () => {
      for (let i = 1; i <= totalFrames; i++) {
        const img = new Image();
        const frameNum = String(i).padStart(4, "0");
        img.src = `/3D Scroll/frame_${frameNum}.png`;
        
        img.onload = () => {
          loadedCount++;
          const percent = Math.floor((loadedCount / totalFrames) * 100);
          setLoadPercentage(percent);
          
          if (loadedCount === totalFrames) {
            // Once all frames are preloaded, add a short premium delay to let the loading animation breathe
            setTimeout(() => {
              setLoading(false);
            }, 1000);
          }
        };

        img.onerror = () => {
          console.error(`Error loading frame_${frameNum}.png`);
          // Continue load progress even on error to avoid landing page getting stuck
          loadedCount++;
          const percent = Math.floor((loadedCount / totalFrames) * 100);
          setLoadPercentage(percent);
          if (loadedCount === totalFrames) {
            setTimeout(() => setLoading(false), 1000);
          }
        };

        loadedImages.push(img);
      }
      setImages(loadedImages);
    };

    preloadImages();

    return () => {
      if (synthRef.current) {
        synthRef.current.stop();
      }
    };
  }, []);

  // Main canvas animation and rendering loop
  useEffect(() => {
    if (loading || images.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Responsive Canvas Resize
    const resizeCanvas = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize Volumetric Dust Particles
    const particles: Particle[] = [];
    const particleCount = 75;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.5 - 0.1,
        size: Math.random() * 2.5 + 0.8,
        alpha: Math.random() * 0.5 + 0.1,
        depth: Math.random() * 1.5 + 0.5, // Parallax depth factor
      });
    }

    // Object-fit: cover implementation for Canvas drawing
    const drawImageCover = (img: HTMLImageElement) => {
      const cw = canvas.width / window.devicePixelRatio;
      const ch = canvas.height / window.devicePixelRatio;
      const iw = img.width;
      const ih = img.height;
      
      const r = Math.min(cw / iw, ch / ih);
      let nw = iw * r;
      let nh = ih * r;
      let ar = 1;
      
      if (nw < cw) ar = cw / nw;
      if (Math.abs(ar - 1) < 1e-14 && nh < ch) ar = ch / nh;
      
      nw *= ar;
      nh *= ar;
      
      const sx = (iw - iw / (nw / cw)) * 0.5;
      const sy = (ih - ih / (nh / ch)) * 0.5;
      const sw = iw / (nw / cw);
      const sh = ih / (nh / ch);
      
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
    };

    // Track mouse move for parallax
    const handleMouseMove = (e: MouseEvent) => {
      scrollInfo.current.targetMouseX = (e.clientX - window.innerWidth / 2) * 0.05;
      scrollInfo.current.targetMouseY = (e.clientY - window.innerHeight / 2) * 0.05;
    };
    window.addEventListener("mousemove", handleMouseMove);

    let animationFrameId: number;

    const render = () => {
      // 1. Interpolate Frame Index (Lerp) for ultra-smooth transitions
      const diff = scrollInfo.current.targetFrame - scrollInfo.current.currentFrame;
      scrollInfo.current.currentFrame += diff * 0.08; // Smooth inertia factor
      
      const frameToDraw = Math.round(scrollInfo.current.currentFrame);
      const img = images[frameToDraw - 1] || images[0];

      if (img && img.complete) {
        // Draw the image sequence frame
        drawImageCover(img);

        // 2. Smoothly lerp mouse coordinates for Parallax
        scrollInfo.current.mouseX += (scrollInfo.current.targetMouseX - scrollInfo.current.mouseX) * 0.05;
        scrollInfo.current.mouseY += (scrollInfo.current.targetMouseY - scrollInfo.current.mouseY) * 0.05;

        // Apply a subtle canvas tilt/offset based on mouse position
        ctx.save();
        ctx.translate(scrollInfo.current.mouseX * 0.2, scrollInfo.current.mouseY * 0.2);

        // 3. Render Volumetric Dust Particles
        const cw = canvas.width / window.devicePixelRatio;
        const ch = canvas.height / window.devicePixelRatio;

        particles.forEach((p) => {
          // Update particle position (float up, react to scroll progress delta, and add mouse sway)
          p.y += p.vy - (diff * 0.15 * p.depth);
          p.x += p.vx + (scrollInfo.current.mouseX * 0.02 * p.depth);

          // Wrap boundaries
          if (p.y < 0) {
            p.y = ch;
            p.x = Math.random() * cw;
          }
          if (p.x < 0) p.x = cw;
          if (p.x > cw) p.x = 0;

          // Drawing glowy teal circles
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          
          // As progress reaches center (reactor deconstructed), particles glow brighter
          const intensity = 1 + Math.sin(scrollInfo.current.progress * Math.PI) * 0.8;
          ctx.fillStyle = `rgba(45, 212, 191, ${Math.min(0.8, p.alpha * intensity * p.depth)})`;
          
          ctx.shadowBlur = 10;
          ctx.shadowColor = "rgba(45, 212, 191, 0.4)";
          ctx.fill();
          ctx.shadowBlur = 0; // Reset shadow for next draws
        });

        // 4. Draw Radial Cinematic Vignette Overlay
        const grad = ctx.createRadialGradient(
          cw / 2, ch / 2, Math.min(cw, ch) * 0.25,
          cw / 2, ch / 2, Math.max(cw, ch) * 0.65
        );
        // Deep black frame matching #050505
        grad.addColorStop(0, "rgba(5, 5, 5, 0)");
        grad.addColorStop(0.5, "rgba(5, 5, 5, 0.15)");
        grad.addColorStop(1, "rgba(5, 5, 5, 0.9)");

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, cw, ch);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [loading, images]);

  // Audio Toggle Action
  const toggleSound = () => {
    if (!synthRef.current) return;
    if (soundOn) {
      synthRef.current.stop();
      setSoundOn(false);
    } else {
      synthRef.current.start();
      setSoundOn(true);
    }
  };

  // Nav indicator scroll action
  const scrollToStage = (stageIndex: number) => {
    if (!containerRef.current) return;
    const scrollHeights = [0, 0.35, 0.68, 0.95];
    const targetScrollFraction = scrollHeights[stageIndex];
    const totalHeight = containerRef.current.scrollHeight - window.innerHeight;
    
    window.scrollTo({
      top: totalHeight * targetScrollFraction,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative w-full text-[#ededed]">
      {/* 1. Cinematic Preloader Screen */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="preloader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.2, ease: [0.76, 0, 0.24, 1] } }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]"
          >
            {/* Background glowing nebulas */}
            <div className="absolute w-[400px] h-[400px] rounded-full bg-teal-500/5 blur-[150px] animate-[pulse_4s_infinite]" />
            <div className="absolute w-[300px] h-[300px] rounded-full bg-cyan-500/5 blur-[120px] animate-[pulse_6s_infinite] delay-1000" />
            
            {/* Holographic scanner effect line */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-teal-500/50 to-transparent shadow-[0_0_20px_rgba(20,184,166,0.6)] animate-[scan_3s_ease-in-out_infinite]" />

            <div className="relative flex flex-col items-center p-10 rounded-[2.5rem] bg-black/40 border border-white/5 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] max-w-sm w-full text-center">
              {/* Outer rotating ring decoration */}
              <div className="absolute inset-0 rounded-[2.5rem] border border-dashed border-teal-500/10 animate-[spin_40s_linear_infinite]" style={{ margin: "-12px" }} />
              
              {/* Circular percentage loader */}
              <div className="relative w-36 h-36 flex items-center justify-center mb-8">
                {/* Slow spinning background dash ring */}
                <div className="absolute w-40 h-40 rounded-full border border-dashed border-teal-500/20 animate-[spin_20s_linear_infinite]" />
                
                <svg className="w-full h-full transform -rotate-90">
                  <defs>
                    <linearGradient id="loader-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" />
                      <stop offset="50%" stopColor="#14b8a6" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="72"
                    cy="72"
                    r="64"
                    className="stroke-neutral-900 fill-none"
                    strokeWidth="2"
                  />
                  <motion.circle
                    cx="72"
                    cy="72"
                    r="64"
                    stroke="url(#loader-grad)"
                    className="fill-none"
                    strokeWidth="3.5"
                    strokeDasharray="402"
                    strokeDashoffset={402 - (402 * loadPercentage) / 100}
                    strokeLinecap="round"
                    transition={{ ease: "easeOut" }}
                  />
                </svg>
                
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-syne font-extrabold tracking-tight text-white drop-shadow-[0_0_12px_rgba(20,184,166,0.6)]">
                    {loadPercentage}%
                  </span>
                  <span className="text-[9px] font-mono text-teal-400 tracking-widest uppercase mt-0.5 animate-pulse">
                    Loading
                  </span>
                </div>
              </div>

              {/* Technical status updates */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-1 mb-6"
              >
                <h3 className="text-xs font-syne font-bold tracking-[0.25em] text-white uppercase">
                  Pillai Euforia
                </h3>
                <p className="text-[10px] font-mono text-teal-400/80 tracking-widest uppercase h-4">
                  {loadPercentage < 25 && "Initializing Matrix..."}
                  {loadPercentage >= 25 && loadPercentage < 55 && "Mapping Arenas..."}
                  {loadPercentage >= 55 && loadPercentage < 85 && "Connecting Core..."}
                  {loadPercentage >= 85 && "Welcome to the Decade..."}
                </p>
                <p className="text-[8px] font-mono text-neutral-600 uppercase tracking-wider pt-1">
                  SYS_STREAM: V{loadPercentage}.09
                </p>
              </motion.div>
              
              <div className="w-32 h-[1px] bg-neutral-900 relative">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-300" 
                  style={{ width: `${loadPercentage}%` }} 
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Glassmorphic Apple-style Navbar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 w-full z-40 px-6 py-4 md:px-12 flex justify-between items-center transition-all duration-300 border-b border-white/[0.03] backdrop-blur-md bg-black/10"
      >
        {/* Left Side: Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => scrollToStage(0)}>
          <div className="relative w-8 h-8 rounded-full border border-teal-500/40 flex items-center justify-center overflow-hidden bg-teal-950/20 group-hover:border-teal-400 transition-colors">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.8)] group-hover:scale-125 transition-transform" />
          </div>
          <span className="text-sm font-syne font-bold tracking-[0.25em] text-white">
            EUFORIA
          </span>
        </div>

        {/* Center Links (Minimalist & Glassmorphic hover) */}
        <div className="hidden md:flex items-center space-x-1.5 glass-panel px-4 py-1.5 rounded-full text-xs font-mono tracking-widest text-neutral-400">
          <button onClick={() => scrollToStage(0)} className="hover:text-teal-400 px-3 py-1 rounded-full transition-colors cursor-pointer">
            HOME
          </button>
          <span className="text-white/10 select-none">•</span>
          <button onClick={() => scrollToStage(1)} className="hover:text-teal-400 px-3 py-1 rounded-full transition-colors cursor-pointer">
            SPONSORS
          </button>
          <span className="text-white/10 select-none">•</span>
          <button onClick={() => scrollToStage(2)} className="hover:text-teal-400 px-3 py-1 rounded-full transition-colors cursor-pointer">
            EVENTS
          </button>
          <span className="text-white/10 select-none">•</span>
          <button onClick={() => scrollToStage(3)} className="hover:text-teal-400 px-3 py-1 rounded-full transition-colors cursor-pointer">
            AFTER MOVIE
          </button>
        </div>

        {/* Right Side: Volume Toggle & CTA */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSound}
            className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all text-neutral-300 relative group cursor-pointer"
            title={soundOn ? "Mute soundtrack" : "Unmute soundtrack"}
          >
            {soundOn ? (
              <>
                <Volume2 size={16} className="text-teal-400 group-hover:scale-110 transition-transform" />
                <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
                </span>
              </>
            ) : (
              <VolumeX size={16} className="group-hover:scale-110 transition-transform" />
            )}
          </button>

          <button
            onClick={() => scrollToStage(2)}
            className="relative px-5 py-2 rounded-full text-xs font-mono tracking-widest text-white border border-teal-500/30 overflow-hidden bg-teal-500/5 hover:bg-teal-500/10 transition-all hover:border-teal-400 hover:shadow-[0_0_20px_rgba(45,212,191,0.25)] cursor-pointer"
          >
            REGISTER NOW
          </button>
        </div>
      </motion.nav>

      {/* 3. Sticky Background Canvas Container */}
      <div className="fixed inset-0 w-full h-screen -z-20 bg-[#050505]">
        <canvas ref={canvasRef} className="w-full h-full block" />
        {/* Cinematic Vignette Overlay to hide watermark and enhance depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/10 to-[#050505]/40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/70 via-transparent to-[#050505]/70 pointer-events-none" />
      </div>

      {/* 4. Awwwards Side Stage Navigator */}
      <div className="fixed right-6 md:right-10 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center space-y-6">
        <span className="text-[10px] font-mono tracking-[0.25em] rotate-90 origin-center translate-y-[-10px] text-teal-500/50 uppercase select-none">
          TIMELINE
        </span>
        <div className="w-[1px] h-12 bg-neutral-800" />
        <div className="flex flex-col space-y-4">
          {[0, 1, 2, 3].map((idx) => (
            <button
              key={idx}
              onClick={() => scrollToStage(idx)}
              className="group flex items-center justify-end relative py-1 cursor-pointer focus:outline-none"
            >
              <span className="absolute right-8 text-[11px] font-syne font-bold tracking-widest text-teal-300 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 pointer-events-none select-none uppercase">
                {idx === 0 && "HOME"}
                {idx === 1 && "SPONSORS"}
                {idx === 2 && "EVENTS"}
                {idx === 3 && "AFTER MOVIE"}
              </span>
              <div
                className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 ${
                  currentStage === idx
                    ? "bg-teal-400 border-teal-400 scale-125 shadow-[0_0_10px_rgba(45,212,191,0.8)]"
                    : "bg-transparent border-neutral-700 group-hover:border-teal-500/50"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* 5. Audio status tip at the bottom left */}
      <div className="fixed left-6 bottom-6 z-30 hidden sm:flex items-center space-x-2 text-[10px] font-mono text-neutral-500 uppercase select-none pointer-events-none">
        <Disc size={12} className={soundOn ? "animate-spin text-teal-500/70" : ""} />
        <span>Audio feedback: {soundOn ? "MODULATING FILTER" : "DORMANT"}</span>
      </div>

      {/* 6. Scroll Driven Text Overlays - Sticky scroll zones */}
      <div ref={containerRef} className="relative w-full h-[600vh] z-10">
        
        {/* SECTION 1: Intro / Ascent (scroll progress ~0% to ~25%) */}
        <ScrollSection scrollYProgress={scrollYProgress} start={0.02} end={0.20}>
          <div className="max-w-3xl flex flex-col space-y-4">
            <div className="flex items-center space-x-3 text-teal-300 font-syne font-bold text-xs md:text-sm tracking-[0.25em]">
              <Compass size={14} className="animate-pulse text-teal-400" />
              <span>HOME</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-syne font-extrabold tracking-tight text-white leading-[1.1]">
              Pillai <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 glow-teal">
                Euforia 2026
              </span>
            </h1>
            <p className="text-xs md:text-sm font-mono text-teal-400/80 tracking-[0.2em] uppercase">
              A Decade of Celebration Redefined
            </p>
            
            <p className="text-xs md:text-sm font-sans text-neutral-300 leading-relaxed max-w-xl">
              Marking its 10th anniversary, Pillai Euforia stands as Maharashtra's most anticipated college festival. Under the vision of Mahatma Education Society's Pillai Group of Institutions, we bring together over 60+ competitive events across music, sports, technology, and art.
            </p>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl pt-4">
              <div className="glass-panel p-3 rounded-xl border border-white/[0.03]">
                <span className="text-xl md:text-2xl font-bold font-syne text-white block glow-teal-text">10k+</span>
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Footfall</span>
              </div>
              <div className="glass-panel p-3 rounded-xl border border-white/[0.03]">
                <span className="text-xl md:text-2xl font-bold font-syne text-white block glow-teal-text">1,000+</span>
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Participants</span>
              </div>
              <div className="glass-panel p-3 rounded-xl border border-white/[0.03]">
                <span className="text-xl md:text-2xl font-bold font-syne text-white block glow-teal-text">60+</span>
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Competitions</span>
              </div>
              <div className="glass-panel p-3 rounded-xl border border-white/[0.03]">
                <span className="text-xl md:text-2xl font-bold font-syne text-white block glow-teal-text">₹1.5L+</span>
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Prize Pool</span>
              </div>
            </div>

          </div>
        </ScrollSection>

        {/* SECTION 2: Sponsors (scroll progress ~25% to ~55%) */}
        <ScrollSection scrollYProgress={scrollYProgress} start={0.28} end={0.48}>
          <div className="w-full flex flex-col space-y-6">
            <div className="max-w-xl flex flex-col space-y-2 text-left self-start">
              <div className="flex items-center space-x-3 text-teal-300 font-syne font-bold text-xs md:text-sm tracking-[0.25em]">
                <Layers size={14} className="text-teal-400" />
                <span>SPONSORS</span>
              </div>
              
              <h2 className="text-3xl md:text-5xl font-syne font-bold tracking-tight text-white leading-tight">
                Our Premium <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-teal-200">
                  Partners
                </span>
              </h2>
              
              <p className="text-xs md:text-sm font-sans text-neutral-300 leading-relaxed">
                Pillai Euforia 2026 is brought to life by the generous support of our industry-leading partners and sponsors.
              </p>
            </div>

            {/* Sponsors Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl w-full text-left">
              {[
                { 
                  name: "Red Bull", 
                  type: "Energy Partner", 
                  logo: "https://www.hatchwise.com/wp-content/uploads/2021/12/Screen-Shot-2021-12-22-at-7.31.49-AM-1024x703.png" 
                },
                { 
                  name: "Sakal", 
                  type: "Print Media Partner", 
                  logo: "https://epaper.esakal.com/images/SakalLogo.png" 
                },
                { 
                  name: "Imagica", 
                  type: "Entertainment Partner", 
                  logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ919u79RB72KMyLwHqx1_pnweRiXq4b7KB9fPYilyPo7MiA6Ep5N9TU_NI&s=10" 
                },
                { 
                  name: "Canara Bank", 
                  type: "Banking Partner", 
                  logo: "https://mayastickers.com/image/cache/catalog/mainimage/ccc/canara_bank_logo_stickers-550x550w.jpg" 
                },
              ].map((sponsor, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="glass-panel p-5 rounded-2xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.04] hover:border-teal-500/20 transition-all duration-300 flex flex-col items-center justify-center text-center space-y-3"
                >
                  <div className="w-full h-20 bg-white/95 rounded-xl p-2 flex items-center justify-center overflow-hidden">
                    <img 
                      src={sponsor.logo} 
                      alt={sponsor.name} 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="font-syne font-bold text-white text-sm tracking-wide">{sponsor.name}</h3>
                    <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block mt-1">{sponsor.type}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </ScrollSection>

        {/* SECTION 3: Unified Events Category Explorer (scroll progress ~55% to ~80%) */}
        <ScrollSection scrollYProgress={scrollYProgress} start={0.58} end={0.78}>
          <div className="w-full flex flex-col space-y-6 items-center text-center max-h-[85vh] overflow-y-auto custom-scrollbar px-2 py-4">
            <div className="max-w-xl flex flex-col space-y-2 text-center items-center">
              <div className="flex items-center space-x-3 text-teal-300 font-syne font-bold text-xs md:text-sm tracking-[0.25em]">
                <Activity size={14} className="animate-[pulse_1.5s_infinite] text-teal-400" />
                <span>REGISTER EVENT</span>
              </div>
              
              <h2 className="text-3xl md:text-5xl font-syne font-bold tracking-tight text-white leading-tight animate-[pulse_3s_infinite]">
                Register <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-300 glow-teal font-serif italic">
                  Event
                </span>
              </h2>
            </div>

            {/* Cover-flow Category Slider */}
            <div className="relative w-full max-w-4xl px-8 flex flex-col items-center select-none">
              {/* Slider viewport */}
              <div className="w-full overflow-hidden py-4 flex justify-center items-center">
                <div 
                  className="flex gap-4 md:gap-6 transition-transform duration-500 ease-out"
                  style={{ 
                    transform: `translateX(calc(50% - 105px - ${categoryIndex * (210 + 24)}px))` 
                  }}
                >
                  {CATEGORIES_LIST.map((cat, idx) => {
                    const isActive = idx === categoryIndex;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => {
                          setCategoryIndex(idx);
                          setSelectedCategory(cat.id);
                        }}
                        className={`relative w-[210px] h-[310px] rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ease-out flex-shrink-0 flex flex-col justify-end p-4 border ${
                          isActive
                            ? "scale-105 border-teal-400/80 shadow-[0_0_30px_rgba(20,184,166,0.25)] z-10"
                            : "scale-95 border-white/5 opacity-40 grayscale hover:opacity-80"
                        }`}
                      >
                        {/* Background Image */}
                        <div 
                          className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
                          style={{ backgroundImage: `url(${cat.image})` }}
                        />
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                        
                        {/* Content */}
                        <div className="relative z-10 space-y-1 text-left">
                          <span className="text-[9px] font-mono tracking-widest text-teal-400 uppercase">{cat.subtitle}</span>
                          <h3 className="font-serif italic text-lg md:text-xl font-bold text-white leading-tight">{cat.title}</h3>
                          
                          {isActive && (
                            <div className="w-8 h-[2px] bg-teal-400 mt-1 mb-2" />
                          )}
                          
                          {isActive && (
                            <p className="text-[10px] text-neutral-300 leading-normal line-clamp-2">{cat.desc}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Slider Arrows */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const prevIdx = (categoryIndex - 1 + CATEGORIES_LIST.length) % CATEGORIES_LIST.length;
                  setCategoryIndex(prevIdx);
                  setSelectedCategory(CATEGORIES_LIST[prevIdx].id);
                }}
                className="absolute left-0 top-[40%] -translate-y-1/2 w-10 h-10 rounded-full bg-teal-400 hover:bg-teal-300 text-black flex items-center justify-center shadow-lg transition-all z-20 cursor-pointer border-none"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const nextIdx = (categoryIndex + 1) % CATEGORIES_LIST.length;
                  setCategoryIndex(nextIdx);
                  setSelectedCategory(CATEGORIES_LIST[nextIdx].id);
                }}
                className="absolute right-0 top-[40%] -translate-y-1/2 w-10 h-10 rounded-full bg-teal-400 hover:bg-teal-300 text-black flex items-center justify-center shadow-lg transition-all z-20 cursor-pointer border-none"
              >
                <ChevronRight size={20} />
              </button>

              {/* Learn More Button */}
              <button
                onClick={() => setSelectedCategory(CATEGORIES_LIST[categoryIndex].id)}
                className="mt-6 px-6 py-2.5 rounded-full text-xs font-syne font-bold tracking-widest text-[#050505] bg-teal-400 hover:bg-teal-300 hover:shadow-[0_0_20px_rgba(45,212,191,0.5)] transition-all flex items-center justify-center space-x-2 cursor-pointer border-none"
              >
                <span>Learn More</span>
                <ChevronDown size={12} />
              </button>
            </div>

            {/* Filtered Events Section in Requested Format */}
            {selectedCategory && (
              <div className="w-full max-w-5xl space-y-6 pt-6 text-center items-center flex flex-col">
                <div className="w-full flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="font-serif italic text-lg md:text-xl text-teal-300 font-bold">
                    {CATEGORIES_LIST.find((c) => c.id === selectedCategory)?.title} Events
                  </h3>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-xs font-mono text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-500 px-3 py-1 rounded-full cursor-pointer transition-all"
                  >
                    Close Events
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
                  {getFilteredEvents(selectedCategory).map((ev, idx) => (
                    <div
                      key={ev.id}
                      className="glass-panel p-5 rounded-2xl border border-sky-500/10 bg-slate-950/70 hover:border-teal-500/30 hover:shadow-[0_0_20px_rgba(45,212,191,0.1)] transition-all duration-300 flex flex-col justify-between text-left h-[260px] relative group"
                    >
                      <div className="space-y-2">
                        <h4 className="font-serif italic font-bold text-sky-300 text-base leading-tight line-clamp-2">
                          S{String(idx + 1).padStart(2, '0')}. {ev.name}
                        </h4>
                        <p className="text-[11px] font-sans text-neutral-400 leading-relaxed line-clamp-4">
                          {ev.rules && ev.rules[0] ? ev.rules[0] : "No specific description available. Standard competition rules apply."}
                        </p>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-white/5">
                        <div className="flex flex-wrap gap-2">
                          <span className="text-sky-300 bg-sky-950/40 border border-sky-500/20 px-2 py-0.5 rounded-full text-[9px] font-mono">
                            {ev.fee}
                          </span>
                          <span className="text-neutral-400 bg-neutral-900/50 border border-neutral-800 px-2 py-0.5 rounded-full text-[9px] font-mono">
                            Offline
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedEvent(ev);
                            setShowRegForm(true);
                          }}
                          className="w-full py-2 rounded-xl text-[10px] font-syne font-bold tracking-wider text-[#050505] bg-teal-400 hover:bg-teal-300 transition-colors cursor-pointer border-none"
                        >
                          Register Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollSection>

        {/* SECTION 4: After Movie (scroll progress ~80% to ~100%) */}
        <ScrollSection scrollYProgress={scrollYProgress} start={0.84} end={1.0} keepVisible>
          <div className="w-full flex flex-col space-y-6 text-center items-center">
            <div className="flex items-center space-x-3 text-teal-300 font-syne font-bold text-xs md:text-sm tracking-[0.25em]">
              <HelpCircle size={14} className="text-teal-400" />
              <span>AFTER MOVIE</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-syne font-extrabold tracking-tight text-white leading-none">
              The Celebration <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400 glow-teal">
                After Movie
              </span>
            </h2>
            
            <p className="text-xs md:text-sm font-sans text-neutral-300 leading-relaxed max-w-lg">
              Relive the magical highlights, heavy drops, and vibrant crowds of our previous edition. Witness the energy of Pillai Euforia!
            </p>

            {/* Year Selector Tabs */}
            <div className="flex space-x-3 font-mono text-xs mb-2">
              {([
                { year: "2025", title: "Euforia 2025" },
                { year: "2024", title: "Euforia 2024" },
                { year: "2023", title: "Euforia 2023" }
              ] as const).map((item) => (
                <button
                  key={item.year}
                  onClick={() => setAfterMovieYear(item.year)}
                  className={`px-4 py-2 rounded-full border transition-all cursor-pointer ${
                    afterMovieYear === item.year
                      ? "bg-teal-500/10 border-teal-400 text-teal-400 shadow-[0_0_15px_rgba(45,212,191,0.2)]"
                      : "border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-white"
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>

            {/* Video Player Box */}
            <div className="w-full max-w-3xl aspect-video rounded-3xl border border-white/10 overflow-hidden glass-panel bg-black/50 shadow-[0_0_50px_rgba(20,184,166,0.1)] relative group">
              <iframe
                key={afterMovieYear}
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${
                  afterMovieYear === "2025" ? "19m3qR0u5xU" :
                  afterMovieYear === "2024" ? "uI9fnC3CfRM" :
                  "spBFzkhJ28I"
                }?autoplay=0&mute=1`}
                title={`Pillai Euforia ${afterMovieYear} After Movie`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </ScrollSection>

      </div>

      {/* Event Details Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            onClick={() => {
              setSelectedEvent(null);
              setShowRegForm(false);
              setRegSubmitted(false);
              setRegForm({ name: "", phone: "", college: "", age: "" });
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-lg glass-panel p-6 md:p-8 rounded-3xl border border-teal-500/30 bg-black/95 shadow-[0_0_50px_rgba(20,184,166,0.15)] overflow-hidden text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Holographic background line */}
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-teal-500 to-transparent shadow-[0_0_20px_rgba(20,184,166,0.5)]" />
              
              <button
                onClick={() => {
                  setSelectedEvent(null);
                  setShowRegForm(false);
                  setRegSubmitted(false);
                  setRegForm({ name: "", phone: "", college: "", age: "" });
                }}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>

              <AnimatePresence mode="wait">
                {/* SUCCESS SCREEN */}
                {regSubmitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="space-y-5 text-center py-4"
                  >
                    <span className="text-4xl block">🌿</span>
                    <h3 className="text-2xl font-syne font-bold text-teal-400 glow-teal-text">
                      Registration Successful!
                    </h3>
                    <p className="text-sm font-sans text-neutral-400 leading-relaxed">
                      Thank you, <strong className="text-white">{regForm.name}</strong>. Your registration for <strong className="text-teal-300">{selectedEvent.name}</strong> has been logged.
                    </p>

                    <div className="bg-teal-500/5 border border-teal-500/10 rounded-2xl p-4 text-left font-mono text-xs text-neutral-400 space-y-2">
                      <div><strong className="text-white">College:</strong> {regForm.college}</div>
                      <div><strong className="text-white">WhatsApp:</strong> {regForm.phone}</div>
                      <div><strong className="text-white">Entry Fee:</strong> {selectedEvent.fee}</div>
                    </div>

                    <p className="text-xs font-mono text-neutral-500">
                      To complete your registration, tap the button below to confirm with our team on WhatsApp.
                    </p>

                    <a
                      href={`https://wa.me/918390575631?text=${encodeURIComponent(`Hi, I just registered for ${selectedEvent.name} at Pillai Euforia 2026. Details:\n- Name: ${regForm.name}\n- College: ${regForm.college}\n- Phone: ${regForm.phone}\n- Age: ${regForm.age}\n- Event: ${selectedEvent.name}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 rounded-full text-xs font-syne font-bold tracking-widest text-[#050505] bg-teal-400 hover:bg-teal-300 hover:shadow-[0_0_20px_rgba(45,212,191,0.5)] transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <MessageSquare size={14} />
                      <span>Confirm on WhatsApp</span>
                    </a>
                  </motion.div>
                ) : showRegForm ? (
                  /* REGISTRATION FORM */
                  <motion.form
                    key="form"
                    onSubmit={handleRegisterSubmit}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <span className="text-[9px] font-mono tracking-widest text-teal-400 uppercase font-semibold">
                        Registration Form
                      </span>
                      <h3 className="text-xl font-syne font-bold text-white mt-1">
                        Register for {selectedEvent.name}
                      </h3>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={regForm.name}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 outline-none focus:border-teal-500/50 transition-colors"
                          placeholder="Enter your full name"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">
                          WhatsApp Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={regForm.phone}
                          onChange={handleInputChange}
                          required
                          pattern="[0-9]{10}"
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 outline-none focus:border-teal-500/50 transition-colors"
                          placeholder="10-digit mobile number"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">
                          College Name
                        </label>
                        <input
                          type="text"
                          name="college"
                          value={regForm.college}
                          onChange={handleInputChange}
                          required
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 outline-none focus:border-teal-500/50 transition-colors"
                          placeholder="Your college name"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">
                          Age
                        </label>
                        <input
                          type="number"
                          name="age"
                          value={regForm.age}
                          onChange={handleInputChange}
                          required
                          min="15"
                          max="30"
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-neutral-600 outline-none focus:border-teal-500/50 transition-colors"
                          placeholder="Your age"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowRegForm(false)}
                        className="w-1/3 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-mono text-white transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="w-2/3 py-2.5 rounded-xl text-xs font-syne font-bold tracking-wider text-[#050505] bg-teal-400 hover:bg-teal-300 transition-colors cursor-pointer"
                      >
                        Register Now
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  /* DETAILS VIEW */
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-5"
                  >
                    <div>
                      <span className="text-[9px] font-mono tracking-widest text-teal-400 uppercase font-semibold">
                        {selectedEvent.category}
                      </span>
                      <h3 className="text-xl md:text-2xl font-syne font-bold text-white mt-1 glow-teal-text">
                        {selectedEvent.name}
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-4 font-mono text-[11px]">
                      <div className="space-y-1">
                        <span className="text-neutral-500 block uppercase tracking-wider">Entry Fee</span>
                        <span className="text-white font-bold flex items-center space-x-1.5">
                          <Trophy size={11} className="text-amber-400" />
                          <span>{selectedEvent.fee}</span>
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-neutral-500 block uppercase tracking-wider">Prize Pool</span>
                        <span className="text-emerald-400 font-bold flex items-center space-x-1.5">
                          <Award size={11} />
                          <span>{selectedEvent.prize1} {selectedEvent.prize2 ? `+ ${selectedEvent.prize2}` : ""}</span>
                        </span>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <span className="text-neutral-500 block uppercase tracking-wider">Schedule & Venue</span>
                        <span className="text-white flex items-center space-x-1.5">
                          <Clock size={11} className="text-teal-400" />
                          <span>{selectedEvent.schedule}</span>
                        </span>
                      </div>
                      {selectedEvent.timeLimit && (
                        <div className="space-y-1">
                          <span className="text-neutral-500 block uppercase tracking-wider">Time Limit</span>
                          <span className="text-white">{selectedEvent.timeLimit}</span>
                        </div>
                      )}
                      {selectedEvent.teamSize && (
                        <div className="space-y-1">
                          <span className="text-neutral-500 block uppercase tracking-wider">Team Size</span>
                          <span className="text-white">{selectedEvent.teamSize}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-widest flex items-center space-x-1.5">
                        <Shield size={11} />
                        <span>Guidelines & Rules</span>
                      </h4>
                      <ul className="space-y-1.5 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar text-[11px] text-neutral-400 leading-relaxed list-disc list-inside">
                        {selectedEvent.rules.map((rule: string, i: number) => (
                          <li key={i} className="pl-1 text-left">{rule}</li>
                        ))}
                      </ul>
                    </div>

                    {selectedEvent.coordinators && (
                      <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="font-mono text-[10px]">
                          <span className="text-neutral-500 block uppercase tracking-wider">Coordinator Contact</span>
                          <span className="text-white flex items-center space-x-1.5 mt-0.5">
                            <Phone size={11} className="text-teal-500" />
                            <span>{selectedEvent.coordinators}</span>
                          </span>
                        </div>
                        
                        <button
                          onClick={() => setShowRegForm(true)}
                          className="px-6 py-2.5 rounded-full text-[10px] font-syne font-bold tracking-wider text-[#050505] bg-teal-400 hover:bg-teal-300 hover:shadow-[0_0_20px_rgba(45,212,191,0.5)] transition-all flex items-center justify-center space-x-1.5 cursor-pointer border-none"
                        >
                          <MessageSquare size={11} />
                          <span>Register For Event</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle styles that are component specific */}
      <style jsx global>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes loading-bar {
          0% { left: -30%; }
          100% { left: 100%; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(20, 184, 166, 0.3);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(20, 184, 166, 0.6);
        }
      `}</style>
    </div>
  );
}

// Optimized Scroll Section component driving editorial fade-in-out effects outside React loop
interface ScrollSectionProps {
  scrollYProgress: any;
  start: number;
  end: number;
  children: React.ReactNode;
  keepVisible?: boolean;
  active?: boolean;
}

function ScrollSection({ scrollYProgress, start, end, children, keepVisible = false, active }: ScrollSectionProps) {
  // Drive transitions on GPU utilizing Framer Motion values
  const opacity = useTransform(
    scrollYProgress,
    keepVisible 
      ? [start, start + 0.05, 1.0, 1.0]
      : [start, start + 0.04, end - 0.04, end],
    keepVisible
      ? [0, 1, 1, 1]
      : [0, 1, 1, 0]
  );

  const y = useTransform(
    scrollYProgress,
    keepVisible
      ? [start, start + 0.05, 1.0, 1.0]
      : [start, start + 0.04, end - 0.04, end],
    keepVisible
      ? [40, 0, 0, 0]
      : [40, 0, 0, -40]
  );

  const pointerEvents = useTransform(opacity, (v) => (v > 0.1 ? "auto" : "none"));

  return (
    <div className="h-screen w-full flex items-center justify-center sticky top-0 px-6 md:px-24 pointer-events-none select-none">
      <motion.div
        style={{ 
          opacity: active === false ? 0 : opacity, 
          y, 
          pointerEvents: active === false ? "none" : pointerEvents 
        }}
        className="w-full max-w-6xl"
      >
        {children}
      </motion.div>
    </div>
  );
}
