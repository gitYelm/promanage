export type Theme = {
  name: string
  label: string
  activeColor: string
  cssVars: {
    light: Record<string, string>
    dark: Record<string, string>
  }
}

export const themes: Theme[] = [
  {
    name: 'zinc',
    label: 'Zinc',
    activeColor: 'oklch(0.205 0 0)',
    cssVars: {
      light: {
        '--primary': 'oklch(0.205 0 0)',
        '--primary-foreground': 'oklch(0.9 0.012 255)',
        '--ring': 'oklch(0.708 0 0)',
      },
      dark: {
        '--primary': 'oklch(0.86 0.012 255)',
        '--primary-foreground': 'oklch(0.205 0 0)',
        '--ring': 'oklch(0.556 0 0)',
      },
    },
  },
  {
    name: 'red',
    label: 'Red',
    activeColor: 'oklch(0.577 0.245 27.325)',
    cssVars: {
      light: {
        '--primary': 'oklch(0.577 0.245 27.325)',
        '--primary-foreground': 'oklch(0.985 0 0)',
        '--ring': 'oklch(0.577 0.245 27.325)',
      },
      dark: {
        '--primary': 'oklch(0.65 0.24 27.325)', // Lighter red for dark mode
        '--primary-foreground': 'oklch(0.145 0 0)',
        '--ring': 'oklch(0.65 0.24 27.325)',
      },
    },
  },
  {
    name: 'blue',
    label: 'Blue',
    activeColor: 'oklch(0.5 0.25 260)',
    cssVars: {
      light: {
        '--primary': 'oklch(0.488 0.243 264.376)', // Blue 600
        '--primary-foreground': 'oklch(0.985 0 0)',
        '--ring': 'oklch(0.488 0.243 264.376)',
      },
      dark: {
        '--primary': 'oklch(0.6 0.2 264.376)', // Blue 500/400
        '--primary-foreground': 'oklch(0.145 0 0)',
        '--ring': 'oklch(0.6 0.2 264.376)',
      },
    },
  },
  {
    name: 'green',
    label: 'Green',
    activeColor: 'oklch(0.55 0.2 145)',
    cssVars: {
      light: {
        '--primary': 'oklch(0.546 0.245 142.495)', // Green 600
        '--primary-foreground': 'oklch(0.145 0 0)',
        '--ring': 'oklch(0.546 0.245 142.495)',
      },
      dark: {
        '--primary': 'oklch(0.65 0.2 142.495)', // Green 500
        '--primary-foreground': 'oklch(0.145 0 0)',
        '--ring': 'oklch(0.65 0.2 142.495)',
      },
    },
  },
  {
    name: 'orange',
    label: 'Orange',
    activeColor: 'oklch(0.6 0.2 50)',
    cssVars: {
      light: {
        '--primary': 'oklch(0.627 0.194 46.677)', // Orange 600
        '--primary-foreground': 'oklch(0.145 0 0)',
        '--ring': 'oklch(0.627 0.194 46.677)',
      },
      dark: {
        '--primary': 'oklch(0.7 0.15 46.677)', // Orange 500
        '--primary-foreground': 'oklch(0.145 0 0)',
        '--ring': 'oklch(0.7 0.15 46.677)',
      },
    },
  },
  {
    name: 'yellow',
    label: 'Yellow',
    activeColor: 'oklch(0.75 0.18 85)',
    cssVars: {
      light: {
        '--primary': 'oklch(0.76 0.17 85)', // Yellow 500-ish
        '--primary-foreground': 'oklch(0.205 0 0)', // Dark text for yellow
        '--ring': 'oklch(0.76 0.17 85)',
      },
      dark: {
        '--primary': 'oklch(0.82 0.15 85)',
        '--primary-foreground': 'oklch(0.205 0 0)',
        '--ring': 'oklch(0.82 0.15 85)',
      },
    },
  },
  {
    name: 'violet',
    label: 'Violet',
    activeColor: 'oklch(0.5 0.25 290)',
    cssVars: {
      light: {
        '--primary': 'oklch(0.5 0.25 290)', // Violet 600
        '--primary-foreground': 'oklch(0.985 0 0)',
        '--ring': 'oklch(0.5 0.25 290)',
      },
      dark: {
        '--primary': 'oklch(0.65 0.2 290)',
        '--primary-foreground': 'oklch(0.145 0 0)',
        '--ring': 'oklch(0.65 0.2 290)',
      },
    },
  },
  {
    name: 'rose',
    label: 'Rose',
    activeColor: 'oklch(0.514 0.222 16.935)',
    cssVars: {
      light: {
        '--primary': 'oklch(0.514 0.222 16.935)', // Rose 700
        '--primary-foreground': 'oklch(0.985 0 0)',
        '--ring': 'oklch(0.514 0.222 16.935)',
      },
      dark: {
        '--primary': 'oklch(0.712 0.194 13.428)', // Rose 400
        '--primary-foreground': 'oklch(0.205 0 0)',
        '--ring': 'oklch(0.712 0.194 13.428)',
      },
    },
  },
  {
    name: 'pink',
    label: 'Pink',
    activeColor: 'oklch(0.525 0.223 3.958)',
    cssVars: {
      light: {
        '--primary': 'oklch(0.525 0.223 3.958)', // Pink 700
        '--primary-foreground': 'oklch(0.985 0 0)',
        '--ring': 'oklch(0.525 0.223 3.958)',
      },
      dark: {
        '--primary': 'oklch(0.718 0.202 349.761)', // Pink 400
        '--primary-foreground': 'oklch(0.205 0 0)',
        '--ring': 'oklch(0.718 0.202 349.761)',
      },
    },
  },
  {
    name: 'purple',
    label: 'Purple',
    activeColor: 'oklch(0.496 0.265 301.924)',
    cssVars: {
      light: {
        '--primary': 'oklch(0.496 0.265 301.924)', // Purple 700
        '--primary-foreground': 'oklch(0.985 0 0)',
        '--ring': 'oklch(0.496 0.265 301.924)',
      },
      dark: {
        '--primary': 'oklch(0.714 0.203 305.504)', // Purple 400
        '--primary-foreground': 'oklch(0.205 0 0)',
        '--ring': 'oklch(0.714 0.203 305.504)',
      },
    },
  },
  {
    name: 'indigo',
    label: 'Indigo',
    activeColor: 'oklch(0.457 0.24 277.023)',
    cssVars: {
      light: {
        '--primary': 'oklch(0.457 0.24 277.023)', // Indigo 700
        '--primary-foreground': 'oklch(0.985 0 0)',
        '--ring': 'oklch(0.457 0.24 277.023)',
      },
      dark: {
        '--primary': 'oklch(0.673 0.182 276.935)', // Indigo 400
        '--primary-foreground': 'oklch(0.205 0 0)',
        '--ring': 'oklch(0.673 0.182 276.935)',
      },
    },
  },
  {
    name: 'sky',
    label: 'Sky',
    activeColor: 'oklch(0.5 0.134 242.749)',
    cssVars: {
      light: {
        '--primary': 'oklch(0.5 0.134 242.749)', // Sky 700
        '--primary-foreground': 'oklch(0.985 0 0)',
        '--ring': 'oklch(0.5 0.134 242.749)',
      },
      dark: {
        '--primary': 'oklch(0.746 0.16 232.661)', // Sky 400
        '--primary-foreground': 'oklch(0.205 0 0)',
        '--ring': 'oklch(0.746 0.16 232.661)',
      },
    },
  },
  {
    name: 'cyan',
    label: 'Cyan',
    activeColor: 'oklch(0.52 0.105 223.128)',
    cssVars: {
      light: {
        '--primary': 'oklch(0.52 0.105 223.128)', // Cyan 700
        '--primary-foreground': 'oklch(0.985 0 0)',
        '--ring': 'oklch(0.52 0.105 223.128)',
      },
      dark: {
        '--primary': 'oklch(0.789 0.154 211.53)', // Cyan 400
        '--primary-foreground': 'oklch(0.205 0 0)',
        '--ring': 'oklch(0.789 0.154 211.53)',
      },
    },
  },
  {
    name: 'teal',
    label: 'Teal',
    activeColor: 'oklch(0.511 0.096 186.391)',
    cssVars: {
      light: {
        '--primary': 'oklch(0.511 0.096 186.391)', // Teal 700
        '--primary-foreground': 'oklch(0.985 0 0)',
        '--ring': 'oklch(0.511 0.096 186.391)',
      },
      dark: {
        '--primary': 'oklch(0.777 0.152 181.912)', // Teal 400
        '--primary-foreground': 'oklch(0.205 0 0)',
        '--ring': 'oklch(0.777 0.152 181.912)',
      },
    },
  },
  {
    name: 'amber',
    label: 'Amber',
    activeColor: 'oklch(0.555 0.163 48.998)',
    cssVars: {
      light: {
        '--primary': 'oklch(0.555 0.163 48.998)', // Amber 700
        '--primary-foreground': 'oklch(0.985 0 0)',
        '--ring': 'oklch(0.555 0.163 48.998)',
      },
      dark: {
        '--primary': 'oklch(0.828 0.189 84.429)', // Amber 400
        '--primary-foreground': 'oklch(0.205 0 0)',
        '--ring': 'oklch(0.828 0.189 84.429)',
      },
    },
  },
]
