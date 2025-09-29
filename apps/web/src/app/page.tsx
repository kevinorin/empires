import { Swords, Shield, Crown, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="game-container">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center text-white mb-16">
          <h1 className="text-6xl font-bold mb-6">
            ⚔️ EMPIRES
          </h1>
          <p className="text-xl mb-8 opacity-90">
            Build your empire, forge alliances, conquer worlds
          </p>
          <div className="flex justify-center gap-4">
            <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-lg text-lg transition-colors">
              Start Playing
            </button>
            <button className="border-2 border-white hover:bg-white hover:text-gray-800 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors">
              Learn More
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-white">
          <div className="text-center">
            <Swords className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
            <h3 className="text-xl font-bold mb-2">Epic Battles</h3>
            <p className="opacity-90">Command armies and conquer enemy villages</p>
          </div>

          <div className="text-center">
            <Shield className="w-16 h-16 mx-auto mb-4 text-blue-400" />
            <h3 className="text-xl font-bold mb-2">Build & Defend</h3>
            <p className="opacity-90">Construct buildings and fortify your empire</p>
          </div>

          <div className="text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-green-400" />
            <h3 className="text-xl font-bold mb-2">Join Alliances</h3>
            <p className="opacity-90">Team up with players worldwide</p>
          </div>

          <div className="text-center">
            <Crown className="w-16 h-16 mx-auto mb-4 text-purple-400" />
            <h3 className="text-xl font-bold mb-2">Web3 Rewards</h3>
            <p className="opacity-90">Earn crypto rewards for your victories</p>
          </div>
        </div>

        {/* Game Preview */}
        <div className="mt-16 bg-black/20 rounded-lg p-8 text-white">
          <h2 className="text-3xl font-bold text-center mb-8">Game Preview</h2>
          <div className="bg-green-900/50 rounded-lg p-6 text-center">
            <p className="text-lg mb-4">🏰 Village View Coming Soon</p>
            <p className="opacity-75">Your empire awaits...</p>

            {/* Resource Preview */}
            <div className="flex justify-center gap-6 mt-6">
              <div className="flex items-center">
                <div className="wood-icon resource-icon"></div>
                <span>750</span>
              </div>
              <div className="flex items-center">
                <div className="clay-icon resource-icon"></div>
                <span>750</span>
              </div>
              <div className="flex items-center">
                <div className="iron-icon resource-icon"></div>
                <span>750</span>
              </div>
              <div className="flex items-center">
                <div className="crop-icon resource-icon"></div>
                <span>750</span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Preview */}
        <div className="mt-8 grid md:grid-cols-3 gap-6 text-white">
          <div className="bg-black/20 rounded-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-yellow-400">0</h3>
            <p>Players Online</p>
          </div>
          <div className="bg-black/20 rounded-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-green-400">0</h3>
            <p>Villages Founded</p>
          </div>
          <div className="bg-black/20 rounded-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-purple-400">0</h3>
            <p>Battles Fought</p>
          </div>
        </div>
      </div>
    </div>
  )
}