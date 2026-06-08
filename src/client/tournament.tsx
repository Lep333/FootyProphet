import './index.css';

import { navigateTo, context, requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Participant, ParticipantList, MatchPost, MatchStatus, MatchResponse } from '../shared/api';

export const Tournament = () => {
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [showAddParticipant, setShowAddParticipant] = useState<boolean>(false);
  const [showAddMatch, setShowAddMatch] = useState<boolean>(false);
  const [teamName, setTeamName] = useState<string>('');
  const [teamFlag, setTeamFlag] = useState<string>('');
  const [teams, setTeams] = useState<Participant[]>([]);
  const [matchHome, setMatchHome] = useState<string>('');
  const [matchAway, setMatchAway] = useState<string>('');
  const [matchStartTime, setMatchStartTime] = useState<string>();
  const [groupStage, setGroupStage] = useState<string>();
  const [matches, setMatches] = useState<MatchResponse[]>([]);

  async function loadParticpants() {
    const response = await fetch("/api/participant");
    const partis: ParticipantList = await response.json();
    setTeams(partis.participants);
  }

  async function loadMatches() {
    const response = await fetch("/api/match");
    const partis: MatchResponse[] = await response.json();
    setMatches(partis);
  }

  useEffect(() => {
    loadParticpants();
  }, [])

  useEffect(() => {
    loadMatches();
  }, [])

  function teamsList() {
    return teams.map((team) => <div className='flex flex-row'><div>{team.flag_emoji}</div><div>{team.name}</div></div>)
  }

  function matchList() {
    return matches.map((match) => 
    <div className='flex flex-col rounded-xl w-full bg-green-400 items-center'>
      <div className='flex flex-row'>{match.startDate ? new Date(match.startDate).toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }) : "No Date"}</div>
      <div className="flex flex-row gap-1 text-purple">{match.tournamentPhase}</div>
      <div className="flex flex-row gap-1">
        <div>{match.flagHome}</div>
        <div>{match.teamHomeName}</div>
        <div>-</div>
        <div>{match.teamAwayName}</div>
        <div>{match.flagAway}</div>
      </div>
    </div>)
  }

  async function addParticipant() {
    const participant: Participant = {
      type: "participant",
      name: teamName,
      flag_emoji: teamFlag,
    }
    await fetch("/api/participant", 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participant
        }),
      }
    )
    loadParticpants();
  }

  async function addMatch() {
    const match: MatchPost = {
      type: "guess_put",
      teamHomeName: matchHome,
      teamAwayName: matchAway,
      startDate: new Date(matchStartTime!),
      tournamentPhase: groupStage!,
      Status: MatchStatus.upcomming,
    }
    fetch("/api/match", 
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json", 
        },
        body: JSON.stringify({
          match
        }),
      }
    )
    loadMatches();
  }

  return (
    <div>
        { showAdminPanel && <div className="flex relative flex-col justify-center items-center min-h-screen gap-6 bg-green-400 dark:bg-gray-900 px-4">
        <div className="flex flex-col items-center gap-4 w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
          <div className='flex flex-row gap-2 text-3xl'>Admin Panel</div>
          <div className="flex flex-col items-center gap-4 w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
            <div className='flex flex-row gap-2 text-xl'>Participants</div>
            {
              teamsList()
            }
            { showAddParticipant && 
            <div>
              <div className='flex flex-row gap-2'><div>Team Name</div><input type="text" value={teamName} onChange={(e) => {setTeamName(e.target.value)}} placeholder='Mexiko'></input></div>
              <div className='flex flex-row gap-2'><div>Team Flag</div><input type="text" value={teamFlag} onChange={(e) => {setTeamFlag(e.target.value)}} placeholder='🌍'></input></div>
              <div className='flex flex-row gap-2'>
                <button className="w-full mt-2 bg-red-700 text-white font-semibold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:bg-gray-400 cursor-pointer disabled:cursor-not-allowed"
                  onClick={() => {setShowAddParticipant(false)}}>Cancel</button>
                <button className="w-full mt-2 bg-red-700 text-white font-semibold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:bg-gray-400 cursor-pointer disabled:cursor-not-allowed"
                  onClick={() => {addParticipant()}}>Add Participant</button>
              </div>
            </div> }
            {!showAddParticipant && <button className="w-full mt-2 bg-red-700 text-white font-semibold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:bg-gray-400 cursor-pointer disabled:cursor-not-allowed" 
              onClick={() => {setShowAddParticipant(!false)}}>Add Participant</button> }
          </div>
          <div className="flex flex-col items-center gap-4 w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
            <div className='flex flex-row gap-2 text-xl'>Matches</div>
            {
              matchList()
            }
            { showAddMatch && 
            <div>
              <div className='flex flex-row gap-2'><div>Team Home</div><select
                value={matchHome}
                onChange={(e) => setMatchHome(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-green-500"
              >
                {/* Placeholder option with an empty string value */}
                <option value="" disabled>-- Choose a country --</option>
                
                {/* 4. Dynamically loop through your array data to build the options */}
                {teams.map((team) => (
                  <option key={team.name} value={team.name}>
                    {team.flag_emoji} {team.name}
                  </option>
                ))}
              </select></div>
              <div className='flex flex-row gap-2'><div>Team Away</div><select
                value={matchAway}
                onChange={(e) => setMatchAway(e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-green-500"
              >
                {/* Placeholder option with an empty string value */}
                <option value="" disabled>-- Choose a country --</option>
                
                {/* 4. Dynamically loop through your array data to build the options */}
                {teams.map((team) => (
                  <option key={team.name} value={team.name}>
                    {team.flag_emoji} {team.name}
                  </option>
                ))}
              </select></div>
              <div className='flex flex-row gap-2'><div>Start Date</div><input type="datetime-local" value={matchStartTime} onChange={(e) => {setMatchStartTime(e.target.value)}}></input></div>
              <div className='flex flex-row gap-2'><div>Stage</div><input type="text" value={groupStage} onChange={(e) => {setGroupStage(e.target.value)}} placeholder='Match Detail'></input></div>
              <div className='flex flex-row gap-2'>
                <button className="w-full mt-2 bg-red-700 text-white font-semibold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:bg-gray-400 cursor-pointer disabled:cursor-not-allowed"
                  onClick={() => {setShowAddMatch(false)}}>Cancel</button>
                <button className="w-full mt-2 bg-red-700 text-white font-semibold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:bg-gray-400 cursor-pointer disabled:cursor-not-allowed"
                  onClick={() => {addMatch()}}>Add Match</button>
              </div>
            </div> }
            {!showAddMatch && <button className="w-full mt-2 bg-red-700 text-white font-semibold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:bg-gray-400 cursor-pointer disabled:cursor-not-allowed" 
              onClick={() => {setShowAddMatch(!false)}}>Add Match</button> }
          </div>
          <button className="w-full mt-2 bg-red-700 text-white font-semibold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:bg-gray-400 cursor-pointer disabled:cursor-not-allowed"
            onClick={() => {setShowAdminPanel(false)}}>Close</button>
        </div>
      </div>}
      <div className="flex relative flex-col justify-center items-center min-h-screen gap-6 bg-green-400 dark:bg-gray-900 px-4">
        <div className="flex flex-col items-center gap-4 w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
          <div className='text-3xl'>Leaderboard</div>
          // only show to admins!
          <button className="w-full mt-2 bg-red-700 text-white font-semibold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:bg-gray-400 cursor-pointer disabled:cursor-not-allowed"
            onClick={() => {setShowAdminPanel(!showAdminPanel)}}>Admin Panel</button>
        </div>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Tournament />
  </StrictMode>
);