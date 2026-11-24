# E.L.L.A. — Plugins

As of v1.7.0

A plugin gives E.L.L.A. tools of your own without changing any program code. A plugin is **purely declarative**: it describes which fixed address is called with which validated values. It contains no executable code and cannot start programs.

---

## Where plugins live

Each plugin is a folder holding exactly one file, `ella-plugin.json`:

```
%APPDATA%\ELLA\plugins\
  weatherstation\
    ella-plugin.json
```

The folder name must equal the `id` in the manifest. E.L.L.A. shows the exact path under **Settings → Plugins**. New or changed plugins appear there after "Rescan".

## E.L.L.A. creates a plugin for you

Since v1.6.9 you do not have to write the file yourself. Say in the chat what the plugin is for and give an example address that works in the browser – for instance: "Build me a plugin for exchange rates. The address is https://api.frankfurter.dev/v1/latest?amount=1&base=EUR&symbols=USD". E.L.L.A. creates the folder and the manifest from it: the part before the question mark becomes the fixed address, every value after it a parameter.

- The address must appear word for word in your message. E.L.L.A. does not build a plugin for an address she found or guessed herself.
- Nothing is enabled by this. You check the plugin like any other under Settings → Plugins and approve it there.
- An existing plugin folder is never overwritten.
- Not possible this way: services with a key or sign-in, POST requests, fixed choice lists and more than eight values. For those you write the manifest by hand, as described below.

## Enabling means approving

A plugin is **off** after you drop it in. Before you enable it, E.L.L.A. shows:

- which server the plugin sends data to,
- which values from the conversation are transmitted,
- which fixed headers are sent along (names only, never the values).

Your approval covers exactly this version of the file. **If the manifest changes later, E.L.L.A. disables the plugin immediately** until you have reviewed and enabled it again.

## Remember results

On the approval page you can also tick **Remember results** (off by default). E.L.L.A. then stores each successful reply of the plugin with its date and time (table `observations`, at most 2 KB per entry, no time limit). Asked about the past (“What was the rate yesterday?”), she answers from these entries and names the date; for a day without an entry she says so and does not guess. Questions about the present still go to the plugin fresh. The approval is bound to the manifest version like enabling itself, and can be changed later in the plugin list. Stored entries are shown and deleted under Memory → Observations.

A plugin without “Remember results” only knows the present: asked about the past, E.L.L.A. does not offer it the tool (unless it has a `date` parameter) and offers to look up the current value instead.

For rates, use the amount 1 in the example address — then each stored value is the rate itself.

## Example

```json
{
  "manifestVersion": 1,
  "id": "weatherstation",
  "name": "Weather Station",
  "version": "1.0.0",
  "author": "Jane Doe",
  "description": "Reads the weather station in the garden.",
  "keywords": ["weather station", "garden"],
  "tools": [
    {
      "name": "reading",
      "description": "Reads a current value from the weather station.",
      "type": "http",
      "request": {
        "method": "GET",
        "url": "http://station.local:8080/api/read",
        "headers": { "Authorization": "Bearer YOUR-TOKEN" },
        "query": { "format": "json" }
      },
      "parameters": {
        "sensor": {
          "type": "enum",
          "values": ["temperature", "humidity"],
          "description": "Which sensor to read",
          "in": "query",
          "required": true
        }
      }
    }
  ]
}
```

When the user asks "How warm is it in the garden?", E.L.L.A. calls `http://station.local:8080/api/read?format=json&sensor=temperature`.

## Manifest fields

| Field             | Required | Rules                                                               |
| ----------------- | -------- | ------------------------------------------------------------------- |
| `manifestVersion` | yes      | always `1`                                                          |
| `id`              | yes      | lowercase letters, digits, `-`; 2–31 characters; equals folder name |
| `name`            | yes      | 2–60 characters                                                     |
| `version`         | yes      | up to 20 characters                                                 |
| `author`          | no       | up to 80 characters                                                 |
| `description`     | yes      | 5–300 characters                                                    |
| `keywords`        | yes      | 1–12 keywords, 3–30 characters each                                 |
| `tools`           | yes      | 1–10 tools                                                          |

**Keywords decide when E.L.L.A. considers the plugin's tools at all:** only when a keyword or the plugin name occurs in the request. Pick words users actually say.

Unknown fields cause the plugin to be rejected. The manifest may be 64 KB at most.

### Tool

| Field         | Required | Rules                                                                 |
| ------------- | -------- | --------------------------------------------------------------------- |
| `name`        | yes      | lowercase letters, digits, single `_`; 2–30 characters; unique        |
| `description` | yes      | 5–200 characters, single line — this is what the language model reads |
| `type`        | yes      | only `"http"`                                                         |
| `request`     | yes      | see below                                                             |
| `parameters`  | no       | 8 at most                                                             |

### request

| Field     | Required | Rules                                                                                |
| --------- | -------- | ------------------------------------------------------------------------------------ |
| `method`  | yes      | `"GET"` or `"POST"`                                                                  |
| `url`     | yes      | complete, fixed `http`/`https` address without `?`, `#`, placeholders or credentials |
| `headers` | no       | fixed headers, 10 at most                                                            |
| `query`   | no       | fixed query values, 10 at most                                                       |
| `body`    | no       | fixed JSON values (POST only), 20 at most                                            |

The address is immutable: no value from the conversation can influence server, port or path. Redirects from the server are rejected. The headers `Host`, `Content-Length`, `Content-Type`, `Transfer-Encoding` and `Connection` cannot be set.

### parameters

Every parameter needs a type with a fixed shape. Free-form strings without a format do not exist.

| `type`    | Additional required fields          | Example                             |
| --------- | ----------------------------------- | ----------------------------------- |
| `enum`    | `values` (1–50 entries)             | `"values": ["on", "off"]`           |
| `integer` | `min`, `max`                        | `"min": 0, "max": 255`              |
| `number`  | `min`, `max`                        | `"min": 0, "max": 1`                |
| `boolean` | —                                   |                                     |
| `string`  | `format`, `maxLength` (500 at most) | `"format": "word", "maxLength": 40` |

Formats for `string`:

| `format` | Allowed                                         |
| -------- | ----------------------------------------------- |
| `word`   | letters, digits, `_` and `-` — a single word    |
| `text`   | any single-line text without control characters |
| `date`   | `YYYY-MM-DD`                                    |
| `time`   | `HH:MM`                                         |

Common fields: `description` (required, up to 120 characters), `in` (`"query"` or `"body"`; `"query"` only for GET) and `required` (default `false`). A parameter must not share its name with a fixed value in `query` or `body`.

If a value does not match its shape, the service is not called at all. Values the manifest does not declare are dropped.

## What E.L.L.A. does at runtime

- **Only on direct request.** A plugin tool runs only as the immediate response to a user message, never as a follow-up step to another tool's reply.
- **Replies are information, not instructions.** E.L.L.A. reads at most 32 KB of the reply and treats it as data.
- **10-second time limit.**
- **Offline mode:** plugins with targets on the internet are blocked; devices on the home network (private IP range or `localhost`) remain usable.
- **Homework mode:** all plugins are blocked.
- **Log:** every call appears in the tool log like any other tool action. Rule Engine rules apply to plugin tools as well (tool name `plugin_<id>__<tool>`).
- **Emergency switch:** disables all plugins.

## Limits

- `http` tools only. Plugins that start local programs deliberately do not exist yet.
- The operator of the target address receives the transmitted values. Only enable plugins whose target you know.
- Credentials in `headers` are stored in plain text in the manifest file on your computer.
- A plugin cannot call E.L.L.A. itself (its own API port).
