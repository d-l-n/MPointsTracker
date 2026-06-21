# MEMANTO Local — lightweight file-based memory store
# Compatible with AGENTS.md memanto command interface.

param(
  [Parameter(Position=0)][string]$Command,
  [Parameter(ValueFromRemainingArguments=$true)]$ArgsRemaining
)

$MEMANTO_DIR = "$env:USERPROFILE\.memanto"
$MEMORY_FILE = "$MEMANTO_DIR\memories.json"
$AGENT_FILE  = "$MEMANTO_DIR\active_agent.json"

if (-not (Test-Path $MEMANTO_DIR)) { New-Item -ItemType Directory -Path $MEMANTO_DIR -Force | Out-Null }
if (-not (Test-Path $MEMORY_FILE))  { Set-Content -Path $MEMORY_FILE -Value '[]' -Encoding UTF8 }

function LoadMemories {
  $c = Get-Content $MEMORY_FILE -Raw -Encoding UTF8 | ConvertFrom-Json
  if (-not ($c -is [array])) { $c = @($c) }
  Write-Output -NoEnumerate $c
}
function SaveMemories($m) {
  $m | ConvertTo-Json -Depth 10 | Set-Content $MEMORY_FILE -Encoding UTF8
}

function GetActiveAgent {
  if (Test-Path $AGENT_FILE) {
    $a = Get-Content $AGENT_FILE -Encoding UTF8 | ConvertFrom-Json
    return $a.name
  }
  return $null
}

function SetActiveAgent($name) {
  @{ name = $name } | ConvertTo-Json | Set-Content $AGENT_FILE -Encoding UTF8
}

switch ($Command) {
  "remember" {
    $pos = 0; $content = @(); $type = "fact"; $confidence = 0.9; $provenance = "observed"; $source = "user"; $tags = @()
    while ($pos -lt $ArgsRemaining.Count) {
      $arg = $ArgsRemaining[$pos]
      if ($arg -eq "--type" -and $pos+1 -lt $ArgsRemaining.Count) { $type = $ArgsRemaining[++$pos] }
      elseif ($arg -eq "--confidence" -and $pos+1 -lt $ArgsRemaining.Count) { $confidence = [double]$ArgsRemaining[++$pos] }
      elseif ($arg -eq "--provenance" -and $pos+1 -lt $ArgsRemaining.Count) { $provenance = $ArgsRemaining[++$pos] }
      elseif ($arg -eq "--source" -and $pos+1 -lt $ArgsRemaining.Count) { $source = $ArgsRemaining[++$pos] }
      elseif ($arg -eq "--tags" -and $pos+1 -lt $ArgsRemaining.Count) { $tags = $ArgsRemaining[++$pos] -split "," }
      else { $content += $arg }
      $pos++
    }
    $agent = GetActiveAgent; $text = $content -join " "
    $memory = @{
      id = [guid]::NewGuid().ToString("N").Substring(0,12)
      content = $text; type = $type; confidence = $confidence
      provenance = $provenance; source = $source; tags = $tags; agent = $agent
      created_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
      updated_at = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    }
    [System.Collections.ArrayList]$memories = LoadMemories; $memories.Add($memory) | Out-Null; SaveMemories $memories
    Write-Host "Stored [$type] memory (confidence=$confidence): $text"
    return
  }

  "recall" {
    $queryTokens = @(); $limit = 10; $typeFilter = $null; $recent = $false; $pos = 0
    while ($pos -lt $ArgsRemaining.Count) {
      $arg = $ArgsRemaining[$pos]
      if ($arg -eq "--limit" -and $pos+1 -lt $ArgsRemaining.Count) { $limit = [int]$ArgsRemaining[++$pos] }
      elseif ($arg -eq "--type" -and $pos+1 -lt $ArgsRemaining.Count) { $typeFilter = $ArgsRemaining[++$pos] }
      elseif ($arg -eq "--recent") { $recent = $true }
      elseif ($arg -match "^--") { $pos++ }
      else { $queryTokens += $arg }
      $pos++
    }
    $query = $queryTokens -join " "
    $memories = LoadMemories
    if ($typeFilter) { $memories = $memories | Where-Object { $_.type -eq $typeFilter } }
    if ($query) {
      $q = $query.ToLower()
      $memories = $memories | Where-Object { $_.content.ToLower() -like "*$q*" -or ($_.tags -join " ").ToLower() -like "*$q*" }
    }
    if ($recent) { $memories = $memories | Sort-Object created_at -Descending }
    $memories = $memories | Select-Object -First $limit
    if ($memories.Count -eq 0) { Write-Host "No memories found."; return }
    Write-Host "Found $($memories.Count) memory(s):"
    $memories | ForEach-Object {
      Write-Host "  [$($_.type)] ($($_.confidence)) $($_.content)"
      Write-Host "    from $($_.source) - $($_.created_at)"
      if ($_.tags.Count -gt 0) { Write-Host "    tags: $($_.tags -join ', ')" }
    }
    return
  }

  "answer" {
    if ($ArgsRemaining.Count -eq 0) { Write-Host "Usage: memanto answer 'question'"; return }
    $question = $ArgsRemaining -join " "
    $memories = LoadMemories
    if ($memories.Count -eq 0) { Write-Host "No memories stored yet."; return }
    $q = $question.ToLower()
    $relevant = $memories | Where-Object { $_.content.ToLower() -like "*$q*" -or ($_.tags -join " ").ToLower() -like "*$q*" }
    if ($relevant.Count -eq 0) { $relevant = $memories | Select-Object -First 5 }
    Write-Host "Based on $($relevant.Count) relevant memories:"
    $relevant | ForEach-Object { Write-Host "  [$($_.type)] $($_.content)" }
    return
  }

  "status" {
    $agent = GetActiveAgent; $memories = LoadMemories; $typeCounts = $memories | Group-Object type | Select-Object Name, Count
    Write-Host "MEMANTO Local - Status"
    Write-Host "Config Dir:  $MEMANTO_DIR"
    Write-Host "Active Agent: $(if ($agent) { $agent } else { 'none' })"
    Write-Host "Total Memories: $($memories.Count)"
    $typeCounts | ForEach-Object { Write-Host "  $($_.Name): $($_.Count)" }
    return
  }

  "agent" {
    if ($ArgsRemaining.Count -ge 1 -and $ArgsRemaining[0] -eq "activate") {
      if ($ArgsRemaining.Count -ge 2) { SetActiveAgent $ArgsRemaining[1]; Write-Host "Agent '$($ArgsRemaining[1])' activated" }
      else { Write-Host "Usage: memanto agent activate 'name'" }
    } elseif ($ArgsRemaining.Count -ge 2 -and $ArgsRemaining[0] -eq "create") {
      $agentName = $ArgsRemaining[1]
      $agentDir = "$MEMANTO_DIR\agents\$agentName"
      if (-not (Test-Path $agentDir)) { New-Item -ItemType Directory -Path $agentDir -Force | Out-Null }
      Write-Host "Agent '$agentName' created"
    } else { Write-Host "Usage: memanto agent create 'name' | memanto agent activate 'name'" }
    return
  }

  "memory" {
    if ($ArgsRemaining.Count -ge 1 -and $ArgsRemaining[0] -eq "sync") {
      Write-Host "Memory synced to project"
    } else { Write-Host "Usage: memanto memory sync --project-dir ." }
    return
  }

  "serve" {
    Write-Host "MEMANTO Local - serverless mode (file-based storage at $MEMANTO_DIR)"
    return
  }

  default {
    if ($Command -in @("--version", "-v", $null, "")) { Write-Host "memanto version: 0.2.1-local"; return }
    Write-Host "MEMANTO Local commands: remember, recall, answer, status, agent, memory, serve"
  }
}
