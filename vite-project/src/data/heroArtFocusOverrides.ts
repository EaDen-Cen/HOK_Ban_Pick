import type { HeroArtCrop, HeroArtLayout } from '../shared/types.js';

export type SharedHeroArtFocusOverrides = Record<number, Partial<Record<HeroArtLayout, HeroArtCrop>>>;

/**
 * Version-controlled broadcast framing defaults.
 *
 * These values are shared by every clone/release. Runtime adjustments made in
 * Control remain in data/match.json until promoted with:
 *
 *   npm run hero:crop-sync
 *
 * Keep only reusable crop metadata here. Per-match useLegacyImage choices stay
 * in runtime state and are intentionally not exported.
 */
const heroArtFocusOverrides: SharedHeroArtFocusOverrides = {
  "72": {
    "panel": {
      "x": 39,
      "y": 11,
      "scale": 2.61
    },
    "side": {
      "x": 36,
      "y": 11,
      "scale": 2.25
    }
  },
  "59": {
    "panel": {
      "x": 48,
      "y": 12,
      "scale": 2.34
    },
    "side": {
      "x": 50,
      "y": 13,
      "scale": 2.03
    }
  },
  "71": {
    "panel": {
      "x": 62,
      "y": 0,
      "scale": 1.87
    },
    "side": {
      "x": 56,
      "y": 0,
      "scale": 1.88
    }
  },
  "30": {
    "panel": {
      "x": 62,
      "y": 0,
      "scale": 1.65
    },
    "side": {
      "x": 51,
      "y": 3,
      "scale": 1.49
    }
  },
  "12": {
    "panel": {
      "x": 40,
      "y": 0,
      "scale": 1.75
    },
    "side": {
      "x": 50,
      "y": 0,
      "scale": 1.71
    }
  },
  "25": {
    "panel": {
      "x": 52,
      "y": 4,
      "scale": 1.44
    },
    "side": {
      "x": 50,
      "y": 0,
      "scale": 1.46
    }
  },
  "3": {
    "panel": {
      "x": 49,
      "y": 31,
      "scale": 2.2
    },
    "side": {
      "x": 56,
      "y": 30,
      "scale": 2.36
    }
  },
  "17": {
    "panel": {
      "x": 48,
      "y": 20,
      "scale": 1.62
    },
    "side": {
      "x": 50,
      "y": 29,
      "scale": 1.67
    }
  },
  "89": {
    "panel": {
      "x": 51,
      "y": 10,
      "scale": 2.7
    },
    "side": {
      "x": 50,
      "y": 17,
      "scale": 2.17
    }
  },
  "64": {
    "panel": {
      "x": 71,
      "y": 31,
      "scale": 1.9
    },
    "side": {
      "x": 84,
      "y": 29,
      "scale": 1.87
    }
  },
  "78": {
    "panel": {
      "x": 70,
      "y": 14,
      "scale": 1.83
    },
    "side": {
      "x": 70,
      "y": 20,
      "scale": 1.65
    }
  },
  "16": {
    "panel": {
      "x": 41,
      "y": 31,
      "scale": 1.68
    },
    "side": {
      "x": 39,
      "y": 38,
      "scale": 1.65
    }
  },
  "94": {
    "panel": {
      "x": 33,
      "y": 12,
      "scale": 2.01
    },
    "side": {
      "x": 32,
      "y": 13,
      "scale": 1.75
    }
  },
  "62": {
    "panel": {
      "x": 29,
      "y": 12,
      "scale": 1.79
    },
    "side": {
      "x": 34,
      "y": 14,
      "scale": 1.63
    }
  },
  "57": {
    "panel": {
      "x": 50,
      "y": 10,
      "scale": 2.21
    },
    "side": {
      "x": 50,
      "y": 5,
      "scale": 2.22
    }
  },
  "20": {
    "panel": {
      "x": 29,
      "y": 8,
      "scale": 1.72
    },
    "side": {
      "x": 27,
      "y": 4,
      "scale": 1.54
    }
  },
  "63": {
    "panel": {
      "x": 27,
      "y": 33,
      "scale": 1.84
    },
    "side": {
      "x": 44,
      "y": 29,
      "scale": 1.74
    }
  },
  "49": {
    "panel": {
      "x": 37,
      "y": 19,
      "scale": 1.83
    },
    "side": {
      "x": 38,
      "y": 25,
      "scale": 1.73
    }
  },
  "67": {
    "panel": {
      "x": 75,
      "y": 34,
      "scale": 1.62
    },
    "side": {
      "x": 72,
      "y": 31,
      "scale": 1.57
    }
  },
  "34": {
    "panel": {
      "x": 67,
      "y": 0,
      "scale": 1.86
    },
    "side": {
      "x": 69,
      "y": 0,
      "scale": 1.67
    }
  },
  "38": {
    "panel": {
      "x": 63,
      "y": 7,
      "scale": 1.57
    },
    "side": {
      "x": 66,
      "y": 11,
      "scale": 1.73
    }
  },
  "31": {
    "panel": {
      "x": 35,
      "y": 0,
      "scale": 1.94
    },
    "side": {
      "x": 33,
      "y": 0,
      "scale": 1.65
    }
  },
  "76": {
    "panel": {
      "x": 57,
      "y": 14,
      "scale": 1.75
    },
    "side": {
      "x": 58,
      "y": 19,
      "scale": 1.94
    }
  },
  "15": {
    "panel": {
      "x": 53,
      "y": 8,
      "scale": 1.77
    },
    "side": {
      "x": 54,
      "y": 0,
      "scale": 1.71
    }
  },
  "41": {
    "panel": {
      "x": 30,
      "y": 0,
      "scale": 1.6
    },
    "side": {
      "x": 23,
      "y": 0,
      "scale": 1.45
    }
  },
  "75": {
    "panel": {
      "x": 41,
      "y": 8,
      "scale": 1.67
    },
    "side": {
      "x": 50,
      "y": 2,
      "scale": 1.52
    }
  },
  "92": {
    "panel": {
      "x": 68,
      "y": 31,
      "scale": 1.71
    },
    "side": {
      "x": 68,
      "y": 29,
      "scale": 1.6
    }
  },
  "73": {
    "panel": {
      "x": 36,
      "y": 10,
      "scale": 2.05
    },
    "side": {
      "x": 41,
      "y": 11,
      "scale": 1.82
    }
  },
  "32": {
    "panel": {
      "x": 56,
      "y": 11,
      "scale": 1.34
    },
    "side": {
      "x": 50,
      "y": 12,
      "scale": 1.28
    }
  },
  "2": {
    "panel": {
      "x": 31,
      "y": 18,
      "scale": 1.68
    },
    "side": {
      "x": 18,
      "y": 22,
      "scale": 1.56
    }
  },
  "44": {
    "panel": {
      "x": 41,
      "y": 12,
      "scale": 2.16
    },
    "side": {
      "x": 39,
      "y": 8,
      "scale": 1.92
    }
  },
  "83": {
    "panel": {
      "x": 42,
      "y": 11,
      "scale": 1.92
    },
    "side": {
      "x": 50,
      "y": 15,
      "scale": 2.01
    }
  },
  "82": {
    "panel": {
      "x": 28,
      "y": 17,
      "scale": 1.4
    },
    "side": {
      "x": 13,
      "y": 10,
      "scale": 1.45
    }
  },
  "29": {
    "panel": {
      "x": 32,
      "y": 7,
      "scale": 1.5
    },
    "side": {
      "x": 37,
      "y": 17,
      "scale": 1.48
    }
  },
  "77": {
    "panel": {
      "x": 54,
      "y": 13,
      "scale": 1.98
    },
    "side": {
      "x": 58,
      "y": 17,
      "scale": 1.58
    }
  },
  "23": {
    "panel": {
      "x": 68,
      "y": 18,
      "scale": 2.36
    },
    "side": {
      "x": 75,
      "y": 15,
      "scale": 1.98
    }
  },
  "80": {
    "panel": {
      "x": 23,
      "y": 22,
      "scale": 1.85
    },
    "side": {
      "x": 20,
      "y": 22,
      "scale": 1.82
    }
  },
  "5": {
    "panel": {
      "x": 85,
      "y": 13,
      "scale": 2.89
    },
    "side": {
      "x": 83,
      "y": 17,
      "scale": 1.84
    }
  },
  "13": {
    "panel": {
      "x": 19,
      "y": 21,
      "scale": 1.44
    },
    "side": {
      "x": 19,
      "y": 17,
      "scale": 1.47
    }
  },
  "14": {
    "panel": {
      "x": 19,
      "y": 8,
      "scale": 1.59
    },
    "side": {
      "x": 31,
      "y": 6,
      "scale": 1.82
    }
  },
  "19": {
    "panel": {
      "x": 67,
      "y": 4,
      "scale": 2.24
    },
    "side": {
      "x": 69,
      "y": 1,
      "scale": 1.58
    }
  },
  "48": {
    "panel": {
      "x": 42,
      "y": 2,
      "scale": 1.9
    },
    "side": {
      "x": 42,
      "y": 5,
      "scale": 1.69
    }
  },
  "60": {
    "panel": {
      "x": 44,
      "y": 9,
      "scale": 2.81
    },
    "side": {
      "x": 50,
      "y": 10,
      "scale": 1.97
    }
  },
  "6": {
    "panel": {
      "x": 59,
      "y": 23,
      "scale": 1.52
    },
    "side": {
      "x": 59,
      "y": 24,
      "scale": 1.65
    }
  },
  "36": {
    "panel": {
      "x": 39,
      "y": 10,
      "scale": 3
    },
    "side": {
      "x": 37,
      "y": 13,
      "scale": 2.84
    }
  },
  "8": {
    "panel": {
      "x": 66,
      "y": 27,
      "scale": 2.3
    },
    "side": {
      "x": 60,
      "y": 29,
      "scale": 2.17
    }
  },
  "53": {
    "panel": {
      "x": 44,
      "y": 21,
      "scale": 1.69
    },
    "side": {
      "x": 39,
      "y": 22,
      "scale": 1.78
    }
  },
  "66": {
    "panel": {
      "x": 31,
      "y": 14,
      "scale": 2.51
    },
    "side": {
      "x": 29,
      "y": 20,
      "scale": 1.9
    }
  },
  "91": {
    "panel": {
      "x": 68,
      "y": 4,
      "scale": 2.07
    },
    "side": {
      "x": 71,
      "y": 4,
      "scale": 1.8
    }
  },
  "81": {
    "panel": {
      "x": 67,
      "y": 17,
      "scale": 1.61
    },
    "side": {
      "x": 61,
      "y": 15,
      "scale": 1.6
    }
  },
  "45": {
    "panel": {
      "x": 69,
      "y": 23,
      "scale": 2.75
    },
    "side": {
      "x": 68,
      "y": 26,
      "scale": 1.93
    }
  },
  "88": {
    "panel": {
      "x": 52,
      "y": 12,
      "scale": 2.6
    },
    "side": {
      "x": 56,
      "y": 8,
      "scale": 2
    }
  },
  "40": {
    "panel": {
      "x": 61,
      "y": 0,
      "scale": 2.3
    },
    "side": {
      "x": 66,
      "y": 2,
      "scale": 1.44
    }
  },
  "86": {
    "panel": {
      "x": 33,
      "y": 19,
      "scale": 2.44
    },
    "side": {
      "x": 34,
      "y": 26,
      "scale": 1.87
    }
  },
  "47": {
    "panel": {
      "x": 46,
      "y": 0,
      "scale": 1.46
    },
    "side": {
      "x": 49,
      "y": 0,
      "scale": 1.3
    }
  },
  "70": {
    "panel": {
      "x": 21,
      "y": 0,
      "scale": 1.84
    },
    "side": {
      "x": 11,
      "y": 0,
      "scale": 1.68
    }
  },
  "54": {
    "panel": {
      "x": 29,
      "y": 10,
      "scale": 1.67
    },
    "side": {
      "x": 45,
      "y": 10,
      "scale": 1.46
    }
  },
  "35": {
    "panel": {
      "x": 30,
      "y": 10,
      "scale": 1.59
    },
    "side": {
      "x": 50,
      "y": 0,
      "scale": 1.54
    }
  },
  "65": {
    "panel": {
      "x": 69,
      "y": 4,
      "scale": 1.42
    },
    "side": {
      "x": 74,
      "y": 6,
      "scale": 1.49
    }
  },
  "93": {
    "panel": {
      "x": 63,
      "y": 44,
      "scale": 2.64
    },
    "side": {
      "x": 50,
      "y": 45,
      "scale": 2.11
    }
  },
  "56": {
    "panel": {
      "x": 30,
      "y": 47,
      "scale": 1.31
    },
    "side": {
      "x": 27,
      "y": 57,
      "scale": 1.47
    }
  },
  "10": {
    "panel": {
      "x": 30,
      "y": 30,
      "scale": 1.66
    },
    "side": {
      "x": 20,
      "y": 29,
      "scale": 1.47
    }
  },
  "68": {
    "panel": {
      "x": 41,
      "y": 8,
      "scale": 2.22
    },
    "side": {
      "x": 39,
      "y": 7,
      "scale": 1.94
    }
  },
  "50": {
    "panel": {
      "x": 33,
      "y": 0,
      "scale": 1.88
    },
    "side": {
      "x": 23,
      "y": 0,
      "scale": 1.49
    }
  },
  "26": {
    "panel": {
      "x": 27,
      "y": 15,
      "scale": 1.88
    },
    "side": {
      "x": 34,
      "y": 24,
      "scale": 1.88
    }
  },
  "37": {
    "panel": {
      "x": 32,
      "y": 34,
      "scale": 1.98
    },
    "side": {
      "x": 31,
      "y": 36,
      "scale": 2.11
    }
  },
  "55": {
    "panel": {
      "x": 61,
      "y": 38,
      "scale": 1.68
    },
    "side": {
      "x": 83,
      "y": 39,
      "scale": 1.72
    }
  },
  "85": {
    "panel": {
      "x": 31,
      "y": 37,
      "scale": 2.1
    },
    "side": {
      "x": 36,
      "y": 43,
      "scale": 1.94
    }
  },
  "18": {
    "panel": {
      "x": 30,
      "y": 7,
      "scale": 2.32
    },
    "side": {
      "x": 23,
      "y": 11,
      "scale": 1.67
    }
  },
  "11": {
    "panel": {
      "x": 56,
      "y": 11,
      "scale": 2.04
    },
    "side": {
      "x": 63,
      "y": 8,
      "scale": 2.06
    }
  },
  "27": {
    "panel": {
      "x": 47,
      "y": 26,
      "scale": 2.69
    },
    "side": {
      "x": 44,
      "y": 27,
      "scale": 2.68
    }
  },
  "28": {
    "panel": {
      "x": 21,
      "y": 15,
      "scale": 2.6
    },
    "side": {
      "x": 26,
      "y": 20,
      "scale": 1.94
    }
  },
  "79": {
    "panel": {
      "x": 27,
      "y": 20,
      "scale": 2.38
    },
    "side": {
      "x": 39,
      "y": 23,
      "scale": 2.27
    }
  },
  "69": {
    "panel": {
      "x": 24,
      "y": 0,
      "scale": 2.66
    },
    "side": {
      "x": 11,
      "y": 0,
      "scale": 2.57
    }
  },
  "74": {
    "panel": {
      "x": 41,
      "y": 12,
      "scale": 3
    },
    "side": {
      "x": 42,
      "y": 15,
      "scale": 2.74
    }
  },
  "42": {
    "panel": {
      "x": 60,
      "y": 18,
      "scale": 1.91
    },
    "side": {
      "x": 54,
      "y": 24,
      "scale": 2.03
    }
  },
  "7": {
    "panel": {
      "x": 51,
      "y": 11,
      "scale": 2.7
    },
    "side": {
      "x": 43,
      "y": 13,
      "scale": 2.18
    }
  },
  "61": {
    "panel": {
      "x": 41,
      "y": 41,
      "scale": 2.38
    },
    "side": {
      "x": 44,
      "y": 38,
      "scale": 2.23
    }
  },
  "24": {
    "panel": {
      "x": 48,
      "y": 18,
      "scale": 2.03
    },
    "side": {
      "x": 60,
      "y": 18,
      "scale": 1.88
    }
  },
  "43": {
    "panel": {
      "x": 68,
      "y": 18,
      "scale": 1.83
    },
    "side": {
      "x": 81,
      "y": 21,
      "scale": 1.48
    }
  },
  "33": {
    "panel": {
      "x": 68,
      "y": 20,
      "scale": 2.1
    },
    "side": {
      "x": 76,
      "y": 15,
      "scale": 1.73
    }
  },
  "52": {
    "panel": {
      "x": 42,
      "y": 8,
      "scale": 2.34
    },
    "side": {
      "x": 45,
      "y": 7,
      "scale": 2.25
    }
  },
  "1": {
    "panel": {
      "x": 25,
      "y": 10,
      "scale": 2.18
    },
    "side": {
      "x": 24,
      "y": 6,
      "scale": 2.44
    }
  },
  "87": {
    "panel": {
      "x": 53,
      "y": 7,
      "scale": 1.99
    },
    "side": {
      "x": 50,
      "y": 0,
      "scale": 1.79
    }
  },
  "9": {
    "panel": {
      "x": 53,
      "y": 23,
      "scale": 2.38
    },
    "side": {
      "x": 66,
      "y": 26,
      "scale": 2.53
    }
  },
  "84": {
    "panel": {
      "x": 39,
      "y": 10,
      "scale": 2.57
    },
    "side": {
      "x": 43,
      "y": 13,
      "scale": 2.47
    }
  },
  "21": {
    "panel": {
      "x": 46,
      "y": 10,
      "scale": 1.56
    },
    "side": {
      "x": 50,
      "y": 4,
      "scale": 1.66
    }
  },
  "22": {
    "panel": {
      "x": 43,
      "y": 18,
      "scale": 2.33
    },
    "side": {
      "x": 44,
      "y": 15,
      "scale": 2.17
    }
  },
  "39": {
    "panel": {
      "x": 69,
      "y": 2,
      "scale": 1.91
    },
    "side": {
      "x": 74,
      "y": 0,
      "scale": 1.97
    }
  },
  "46": {
    "panel": {
      "x": 22,
      "y": 5,
      "scale": 2.32
    },
    "side": {
      "x": 28,
      "y": 10,
      "scale": 1.75
    }
  },
  "51": {
    "panel": {
      "x": 64,
      "y": 45,
      "scale": 2.12
    },
    "side": {
      "x": 56,
      "y": 40,
      "scale": 2.09
    }
  },
  "90": {
    "panel": {
      "x": 51,
      "y": 6,
      "scale": 2.86
    },
    "side": {
      "x": 52,
      "y": 10,
      "scale": 2.34
    }
  },
  "4": {
    "panel": {
      "x": 29,
      "y": 11,
      "scale": 2.03
    },
    "side": {
      "x": 27,
      "y": 15,
      "scale": 2.12
    }
  },
  "95": {
    "panel": {
      "x": 19,
      "y": 13,
      "scale": 1.78
    },
    "side": {
      "x": 6,
      "y": 23,
      "scale": 1.81
    }
  },
  "114": {
    "panel": {
      "x": 37,
      "y": 0,
      "scale": 1.86
    },
    "side": {
      "x": 5,
      "y": 0,
      "scale": 1.73
    }
  },
  "104": {
    "panel": {
      "x": 50,
      "y": 31,
      "scale": 1.12
    },
    "side": {
      "x": 50,
      "y": 29,
      "scale": 1.22
    }
  },
  "110": {
    "panel": {
      "x": 50,
      "y": 31,
      "scale": 1.12
    },
    "side": {
      "x": 50,
      "y": 29,
      "scale": 1.22
    }
  },
  "98": {
    "panel": {
      "x": 15,
      "y": 3,
      "scale": 2.01
    },
    "side": {
      "x": 20,
      "y": 5,
      "scale": 1.74
    }
  },
  "102": {
    "panel": {
      "x": 63,
      "y": 11,
      "scale": 2.13
    },
    "side": {
      "x": 65,
      "y": 13,
      "scale": 1.95
    }
  },
  "103": {
    "panel": {
      "x": 47,
      "y": 11,
      "scale": 2.73
    },
    "side": {
      "x": 50,
      "y": 11,
      "scale": 2.73
    }
  },
  "109": {
    "panel": {
      "x": 68,
      "y": 11,
      "scale": 1.47
    },
    "side": {
      "x": 55,
      "y": 21,
      "scale": 1.4
    }
  },
  "111": {
    "panel": {
      "x": 50,
      "y": 15,
      "scale": 2.25
    },
    "side": {
      "x": 50,
      "y": 12,
      "scale": 2.34
    }
  },
  "101": {
    "panel": {
      "x": 49,
      "y": 15,
      "scale": 2.82
    },
    "side": {
      "x": 50,
      "y": 18,
      "scale": 2.05
    }
  },
  "97": {
    "panel": {
      "x": 71,
      "y": 45,
      "scale": 2.16
    },
    "side": {
      "x": 92,
      "y": 52,
      "scale": 2.29
    }
  },
  "96": {
    "panel": {
      "x": 49,
      "y": 0,
      "scale": 2.05
    },
    "side": {
      "x": 45,
      "y": 0,
      "scale": 1.82
    }
  },
  "99": {
    "panel": {
      "x": 45,
      "y": 6,
      "scale": 2.65
    },
    "side": {
      "x": 51,
      "y": 7,
      "scale": 2.13
    }
  },
  "113": {
    "panel": {
      "x": 61,
      "y": 17,
      "scale": 3
    },
    "side": {
      "x": 54,
      "y": 18,
      "scale": 2.71
    }
  },
  "118": {
    "panel": {
      "x": 60,
      "y": 7,
      "scale": 2.21
    },
    "side": {
      "x": 61,
      "y": 8,
      "scale": 2.3
    }
  },
  "100": {
    "panel": {
      "x": 63,
      "y": 14,
      "scale": 1.78
    },
    "side": {
      "x": 58,
      "y": 17,
      "scale": 1.87
    }
  },
  "112": {
    "panel": {
      "x": 56,
      "y": 18,
      "scale": 2.34
    },
    "side": {
      "x": 54,
      "y": 16,
      "scale": 2.14
    }
  },
  "117": {
    "panel": {
      "x": 51,
      "y": 26,
      "scale": 2.13
    },
    "side": {
      "x": 51,
      "y": 28,
      "scale": 2.09
    }
  },
  "106": {
    "panel": {
      "x": 50,
      "y": 31,
      "scale": 1.12
    },
    "side": {
      "x": 50,
      "y": 29,
      "scale": 1.22
    }
  },
  "119": {
    "panel": {
      "x": 55,
      "y": 18,
      "scale": 1.85
    },
    "side": {
      "x": 64,
      "y": 23,
      "scale": 2.2
    }
  }
};

export default heroArtFocusOverrides;
