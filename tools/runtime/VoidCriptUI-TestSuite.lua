-- VoidCriptUI runtime verification suite.
-- Run this in the target Roblox-compatible environment, then export the JSONL lines.
-- This script intentionally does not use executor-specific APIs.

local results = {}
local function report(name, status, ms, detail)
    local row = {test = name, status = status, ms = ms}
    if detail then row.detail = detail end
    results[#results + 1] = row
    print(string.format('{"test":%q,"status":%q,"ms":%.3f%s}', name, status, ms or 0, detail and string.format(',"detail":%q', detail) or ''))
end

local function run(name, fn)
    local started = os.clock()
    local ok, err = pcall(fn)
    report(name, ok and 'pass' or 'fail', (os.clock() - started) * 1000, ok and nil or tostring(err))
end

run('LoadLibrary', function()
    assert(VoidLib, 'Set VoidLib to the loaded VoidCriptUI module before running the suite')
end)

run('LibraryIdentity', function()
    assert(type(VoidLib) == 'table', 'VoidLib is expected to be a table-like library object')
end)

run('CreateWindow', function()
    assert(type(VoidLib.Window) == 'function' or type(VoidLib.CreateWindow) == 'function', 'Window constructor was not found')
end)

print('-- Runtime test suite complete. Review the JSONL lines above and import them at /qa/runtime. --')
