"use client";

export function RulesView() {
  return (
    <section className="space-y-6 text-sm text-gray-300 leading-relaxed">
      <h2 className="text-lg font-semibold text-white">Rules of Phenomenon</h2>
      <p>
        Gain followers, smite your enemies, and shun the nonbelievers. Be part of the Phenomenon!
      </p>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-white">Overview</h3>
          <p>
            Requires 4 to 9 starting players. Once the game starts, an unlimited number of
            participants can join as Acolytes by buying Tickets to Valhalla. Players register
            to become prophets. A prophet wins by being the last prophet alive.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-white">The Chosen One</h3>
          <p>
            At the start of the game, one prophet is randomly selected to be The Chosen One.
            The Chosen One has divine powers and will never fail to perform a miracle or smite
            another player. No one knows who the Chosen One is — not even the Chosen One.
            Players must deduce this through gameplay.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-white">Prophet Actions</h3>
          <p>When it is a prophet&apos;s turn, they can perform one of three actions:</p>
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3 space-y-1">
          <h4 className="font-medium text-emerald-400">Perform Miracle</h4>
          <p>
            Show your divinity. The Chosen One always succeeds. Other prophets start with
            a 75% chance of success, improved by having more followers. Failing a miracle
            results in elimination. A successful miracle frees a jailed prophet.
          </p>
          <p className="text-xs text-gray-500">
            Odds = 75% + (ticketShare / 10)
          </p>
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3 space-y-1">
          <h4 className="font-medium text-amber-400">Attempt to Smite</h4>
          <p>
            Target another prophet to eliminate them. The Chosen One always succeeds.
            Other prophets start with a 10% chance, improved by followers. Failure
            results in being jailed. If already jailed, a failed smite results in
            execution and elimination.
          </p>
          <p className="text-xs text-gray-500">
            Odds = 10% + (ticketShare / 2)
          </p>
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-3 space-y-1">
          <h4 className="font-medium text-red-400">Accuse of Blasphemy</h4>
          <p>
            A successful accusation has two outcomes: if the target is free, they are
            jailed. If the target is already jailed, they are executed and eliminated.
            The Chosen One has no advantage here. Failure results in the accuser being
            jailed. Jailed prophets cannot accuse.
          </p>
          <p className="text-xs text-gray-500">
            Odds = 10% + ticketShare
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-white">Jail</h3>
          <p>
            Jailed prophets are at risk of execution. A prophet can be jailed by: failing
            an accusation, failing a smite, or being successfully accused. While jailed,
            a successful accusation against them results in execution. Jailed prophets
            cannot accuse of blasphemy. A successful miracle frees a jailed prophet.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-white">High Priests</h3>
          <p>
            At the start of the game, some prophets may randomly be chosen as High Priests.
            High Priests cannot win the game on their own, but if they are the High Priest
            of the last remaining prophet, they also win. Prophets with High Priests have
            improved odds. If the prophet a High Priest supports is eliminated, the High
            Priest is also eliminated. High Priests may change allegiance at any time as long
            as they have not been eliminated, except when only 2 living prophets remain.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-white">Acolytes &amp; Tickets to Valhalla</h3>
          <p>
            Anyone not registered as a prophet or High Priest can become an Acolyte by buying
            Tickets to Valhalla for a prophet. Acolytes can only hold tickets of one prophet
            at a time. To change allegiance, an Acolyte must first sell all tickets of their
            current prophet. More followers improve a prophet&apos;s odds of success.
          </p>
          <p>
            Tickets are bought and sold on a bonding curve — the fewer tickets in circulation,
            the lower the price. Holding tickets of the last remaining prophet entitles the
            holder to a proportional share of the prize pool. If a prophet is eliminated,
            their tickets become worthless.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-white">Winning &amp; Claiming</h3>
          <p>
            When only one prophet remains, the game ends. Anyone holding tickets of the
            winning prophet can claim their share of the prize pool. The value of each
            winning ticket equals the total tokens deposited divided by the number of
            winning tickets. There is a 5% protocol fee on all funds.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-white">Force Turn (Anti-Griefing)</h3>
          <p>
            If a player has not taken their turn within the allowed time, anyone may force
            them to perform a miracle by clicking the Force Turn button. This prevents
            players from stalling the game.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-white">Resetting the Game</h3>
          <p>
            After a game ends, there is a cooldown period before a new game can be started.
            Anyone can reset the game with the desired number of players for the next round.
          </p>
        </div>
      </div>
    </section>
  );
}
