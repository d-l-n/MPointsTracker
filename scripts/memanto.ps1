# MEMANTO Local - lightweight file-based memory store.
# Compatible with the AGENTS.md memanto command interface.
# Supports project-level shared memory (.ai/memory.json) with user-local fallback.

param(
  [Parameter(Position=0)][string]$Command,
  [Parameter(ValueFromRemainingArguments=$true)]$ArgsRemaining
)

function Get-OptionValue([object[]]$Items, [string]$Name, $Fallback = $null) {
  for ($i = 0; $i -lt $Items.Count; $i++) {
    if ($Items[$i] -eq $Name -and $i + 1 -lt $Items.Count) { return $Items[$i + 1] }
  }
  return $Fallback
}

function Test-Flag([object[]]$Items, [string]$Name) {
  return $Items -contains $Name
}

function GetProjectDir {
  $dir = Get-OptionValue -Items $ArgsRemaining -Name "--project-dir" -Fallback $null
  if ($dir) { return (Resolve-Path $dir -ErrorAction SilentlyContinue).Path }
  return (Get-Location).Path
}

function GetMemoryPaths {
  $projDir = GetProjectDir
  $projFile = Join-Path $projDir ".ai\memory.json"
  if (Test-Path $projFile) {
    return @{ dir = $projDir; memory_file = $projFile; agent_file = "$env:USERPROFILE\.memanto\active_agent.json"; is_project = $true }
  }
  return @{ dir = $projDir; memory_file = "$env:USERPROFILE\.memanto\memories.json"; agent_file = "$env:USERPROFILE\.memanto\active_agent.json"; is_project = $false }
}

$paths = GetMemoryPaths
$MEMORY_FILE = $paths.memory_file
$AGENT_FILE  = $paths.agent_file

if (-not (Test-Path "$env:USERPROFILE\.memanto")) { New-Item -ItemType Directory -Path "$env:USERPROFILE\.memanto" -Force | Out-Null }
if (-not (Test-Path $MEMORY_FILE))  { Set-Content -Path $MEMORY_FILE -Value '[]' -Encoding UTF8 }

function LoadMemories {
  $raw = Get-Content $MEMORY_FILE -Raw -Encoding UTF8
  if ([string]::IsNullOrWhiteSpace($raw)) { return @() }
  $items = $raw | ConvertFrom-Json
  if ($null -eq $items) { return @() }
  if ($items -is [array]) { return $items }
  return @($items)
}

function SaveMemories($memories) {
  @($memories) | ConvertTo-Json -Depth 12 | Set-Content $MEMORY_FILE -Encoding UTF8
}

function GetActiveAgent {
  if (-not (Test-Path $AGENT_FILE)) { return $null }
  return (Get-Content $AGENT_FILE -Raw -Encoding UTF8 | ConvertFrom-Json).name
}

function SetActiveAgent($name) {
  @{ name = $name } | ConvertTo-Json | Set-Content $AGENT_FILE -Encoding UTF8
}

function Get-ContentArgs([object[]]$Items) {
  $out = @()
  for ($i = 0; $i -lt $Items.Count; $i++) {
    $arg = $Items[$i]
    if ($arg -in @("--type", "--confidence", "--provenance", "--source", "--tags", "--limit", "--as-of", "--changed-since", "--project-dir")) {
      $i++
    } elseif ($arg -notmatch "^--") {
      $out += $arg
    }
  }
  return ($out -join " ").Trim()
}

function Parse-TimeSpec($spec) {
  if ([string]::IsNullOrWhiteSpace($spec)) { return $null }
  if ($spec -match "^last\s+(\d+)\s+days?$") { return [DateTimeOffset]::UtcNow.AddDays(-[int]$matches[1]) }
  return [DateTimeOffset]::Parse($spec).ToUniversalTime()
}

function MemoryTime($memory) {
  $value = if ($memory.updated_at) { $memory.updated_at } else { $memory.created_at }
  $parsed = [DateTimeOffset]::MinValue
  $styles = [Globalization.DateTimeStyles]::AssumeUniversal -bor [Globalization.DateTimeStyles]::AdjustToUniversal
  if ([DateTimeOffset]::TryParse($value, [Globalization.CultureInfo]::InvariantCulture, $styles, [ref]$parsed)) {
    return $parsed.ToUniversalTime()
  }
  $formats = @("MM/dd/yyyy HH:mm:ss", "M/d/yyyy HH:mm:ss", "yyyy-MM-ddTHH:mm:ssZ", "yyyy-MM-ddTHH:mm:ss.fffffffK")
  if ([DateTimeOffset]::TryParseExact($value, $formats, [Globalization.CultureInfo]::InvariantCulture, $styles, [ref]$parsed)) {
    return $parsed.ToUniversalTime()
  }
  return [DateTimeOffset]::MinValue
}

function SelectMemories([object[]]$Items) {
  $limit = [int](Get-OptionValue -Items $Items -Name "--limit" -Fallback 10)
  $typeFilter = Get-OptionValue -Items $Items -Name "--type"
  $query = Get-ContentArgs -Items $Items
  $since = Parse-TimeSpec (Get-OptionValue -Items $Items -Name "--changed-since")
  $asOf = Parse-TimeSpec (Get-OptionValue -Items $Items -Name "--as-of")
  $memories = @(LoadMemories)

  if ($typeFilter) { $memories = @($memories | Where-Object { $_.type -eq $typeFilter }) }
  if ($since) { $memories = @($memories | Where-Object { (MemoryTime $_) -ge $since }) }
  if ($asOf) { $memories = @($memories | Where-Object { (MemoryTime $_) -le $asOf }) }
  if ($query) {
    $q = $query.ToLowerInvariant()
    $memories = @($memories | Where-Object {
      $_.content.ToLowerInvariant().Contains($q) -or (($_.tags -join " ").ToLowerInvariant().Contains($q))
    })
  }
  if (Test-Flag -Items $Items -Name "--recent") { $memories = @($memories | Sort-Object created_at -Descending) }
  return @($memories | Select-Object -First $limit)
}

function WriteMemoryList($memories) {
  if ($memories.Count -eq 0) { Write-Host "No memories found."; return }
  Write-Host "Found $($memories.Count) memory(s):"
  $memories | ForEach-Object {
    Write-Host "  [$($_.type)] ($($_.confidence)) $($_.content)"
    Write-Host "    from $($_.source) - $($_.created_at)"
    if ($_.tags -and $_.tags.Count -gt 0) { Write-Host "    tags: $($_.tags -join ', ')" }
  }
}

function WriteProjectMemory($projectDir) {
  if ([string]::IsNullOrWhiteSpace($projectDir)) { $projectDir = "." }
  $resolved = (Resolve-Path $projectDir).Path
  $path = Join-Path $resolved "MEMORY.md"
  $memories = @(LoadMemories | Sort-Object created_at -Descending)
  $lines = @(
    "# MEMORY.md",
    "",
    "Auto-synced from MEMANTO Local at $([DateTimeOffset]::Now.ToString("yyyy-MM-dd HH:mm:ss zzz")).",
    "",
    "## Recent Memories"
  )
  foreach ($memory in $memories) {
    $tags = if ($memory.tags -and $memory.tags.Count -gt 0) { " tags: $($memory.tags -join ', ')" } else { "" }
    $lines += "- [$($memory.type)] ($($memory.confidence)) $($memory.content)"
    $lines += "  source: $($memory.source); provenance: $($memory.provenance); created: $($memory.created_at);$tags"
  }
  $lines | Set-Content -Path $path -Encoding UTF8
  Write-Host "Memory synced to project: $path"
}

switch ($Command) {
  "remember" {
    $text = Get-ContentArgs -Items $ArgsRemaining
    if ([string]::IsNullOrWhiteSpace($text)) { Write-Host "Usage: memanto remember 'content' --type ... --confidence ... --provenance ... --source ..."; return }
    $memory = [ordered]@{
      id = [guid]::NewGuid().ToString("N").Substring(0,12)
      content = $text
      type = Get-OptionValue -Items $ArgsRemaining -Name "--type" -Fallback "fact"
      confidence = [double](Get-OptionValue -Items $ArgsRemaining -Name "--confidence" -Fallback 0.9)
      provenance = Get-OptionValue -Items $ArgsRemaining -Name "--provenance" -Fallback "observed"
      source = Get-OptionValue -Items $ArgsRemaining -Name "--source" -Fallback "user"
      tags = @((Get-OptionValue -Items $ArgsRemaining -Name "--tags" -Fallback "") -split "," | Where-Object { $_ })
      agent = GetActiveAgent
      created_at = [DateTimeOffset]::UtcNow.ToString("o")
      updated_at = [DateTimeOffset]::UtcNow.ToString("o")
    }
    $memories = [System.Collections.ArrayList]@(LoadMemories)
    $memories.Add([pscustomobject]$memory) | Out-Null
    SaveMemories $memories
    Write-Host "Stored [$($memory.type)] memory (confidence=$($memory.confidence)): $text"
    return
  }

  "recall" {
    WriteMemoryList @(SelectMemories -Items $ArgsRemaining)
    return
  }

  "answer" {
    $question = Get-ContentArgs -Items $ArgsRemaining
    if (-not $question) { Write-Host "Usage: memanto answer 'question'"; return }
    $matches = @(SelectMemories -Items @($question, "--limit", "5"))
    if ($matches.Count -eq 0) { $matches = @(LoadMemories | Sort-Object created_at -Descending | Select-Object -First 5) }
    if ($matches.Count -eq 0) { Write-Host "No memories stored yet."; return }
    Write-Host "Based on $($matches.Count) relevant memories:"
    $matches | ForEach-Object { Write-Host "  [$($_.type)] $($_.content)" }
    return
  }

  "status" {
    $agent = GetActiveAgent
    $memories = @(LoadMemories)
    $mode = if ($paths.is_project) { "project (.ai/memory.json)" } else { "user-local" }
    Write-Host "MEMANTO - Status"
    Write-Host "Storage:     $MEMORY_FILE ($mode)"
    Write-Host "Active Agent: $(if ($agent) { $agent } else { 'none' })"
    Write-Host "Total Memories: $($memories.Count)"
    $memories | Group-Object type | ForEach-Object { Write-Host "  $($_.Name): $($_.Count)" }
    return
  }

  "agent" {
    if ($ArgsRemaining.Count -ge 2 -and $ArgsRemaining[0] -eq "activate") {
      SetActiveAgent $ArgsRemaining[1]
      Write-Host "Agent '$($ArgsRemaining[1])' activated"
    } elseif ($ArgsRemaining.Count -ge 2 -and $ArgsRemaining[0] -eq "create") {
      $agentDir = Join-Path $MEMANTO_DIR "agents\$($ArgsRemaining[1])"
      if (-not (Test-Path $agentDir)) { New-Item -ItemType Directory -Path $agentDir -Force | Out-Null }
      Write-Host "Agent '$($ArgsRemaining[1])' created"
    } else {
      Write-Host "Usage: memanto agent create 'name' | memanto agent activate 'name'"
    }
    return
  }

  "memory" {
    if ($ArgsRemaining.Count -ge 1 -and $ArgsRemaining[0] -eq "sync") {
      WriteProjectMemory (Get-OptionValue -Items $ArgsRemaining -Name "--project-dir" -Fallback ".")
    } else {
      Write-Host "Usage: memanto memory sync --project-dir ."
    }
    return
  }

  "serve" {
    Write-Host "MEMANTO Local - serverless mode (file-based storage at $MEMANTO_DIR)"
    return
  }

  default {
    if ($Command -in @("--version", "-v", $null, "")) { Write-Host "memanto version: 0.2.2-local"; return }
    Write-Host "MEMANTO Local commands: remember, recall, answer, status, agent, memory, serve"
  }
}
