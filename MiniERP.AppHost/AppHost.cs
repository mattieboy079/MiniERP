var builder = DistributedApplication.CreateBuilder(args);

// SQL Server database (runs in a container, needs Docker/Podman).
// A data volume keeps the database contents across restarts.
var sql = builder.AddSqlServer("sql")
    .WithDataVolume();

var database = sql.AddDatabase("minierpdb");

// The existing MiniERP API, wired to the SQL database.
var api = builder.AddProject<Projects.MiniERP>("api")
    .WithReference(database)
    .WaitFor(database);

// The React (Vite) frontend, which talks to the API.
builder.AddNpmApp("web", "../MiniERP.Web", "dev")
    .WithReference(api)
    .WaitFor(api)
    .WithEnvironment("VITE_API_URL", api.GetEndpoint("http"))
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints()
    .PublishAsDockerFile();

builder.Build().Run();
